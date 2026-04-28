use ssh2::Session;
use std::net::TcpStream;
use std::io::{Write, Read};
use std::path::Path;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::fs;
use std::time::{SystemTime, UNIX_EPOCH};
use std::sync::RwLock;
use once_cell::sync::Lazy;

fn normalize_windows_path(path: &str) -> String {
    path.replace('/', "\\")
}

fn sftp_path_variants(path: &str) -> Vec<String> {
    let slash_path = path.replace('\\', "/");
    let slash_trimmed = slash_path.trim_start_matches('/');
    let mut variants = vec![slash_path.clone()];

    // Windows OpenSSH SFTP 常见格式: /C:/ACC_Server/file.zip
    variants.push(format!("/{}", slash_trimmed));

    // 某些环境会把盘符路径映射为 /C/ACC_Server/file.zip
    if let Some((drive, rest)) = slash_trimmed.split_once(":/") {
        variants.push(format!("/{}/{}", drive, rest));
    }

    variants.sort();
    variants.dedup();
    variants
}

/// 将 PowerShell 脚本编码为 -EncodedCommand 所需的 Base64(UTF-16LE) 格式，
/// 彻底规避 cmd.exe 对管道符、引号等特殊字符的错误解析。
fn encode_powershell_command(script: &str) -> String {
    use base64::Engine;
    let utf16le: Vec<u8> = script
        .encode_utf16()
        .flat_map(|c| c.to_le_bytes())
        .collect();
    base64::engine::general_purpose::STANDARD.encode(&utf16le)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SshConfig {
    pub host: String,
    pub port: u16,
    pub username: String,
    #[serde(default = "default_auth_type")]
    pub auth_type: String,
    pub password: Option<String>,
    #[serde(default, skip_deserializing)]
    pub private_key: Option<String>,
}

fn default_auth_type() -> String {
    "password".to_string()
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeployOptions {
    pub server_path: Option<String>,
    pub download_server: bool,
    pub server_download_url: Option<String>,
    pub start_server: bool,
    pub download_results: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServerProfile {
    pub name: String,
    pub config: SshConfig,
    pub server_path: Option<String>,
    #[serde(default)]
    pub description: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SshConnectionStatus {
    pub connected: bool,
    pub host: Option<String>,
    pub port: Option<u16>,
    pub username: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SshTestResult {
    pub success: bool,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DeployResult {
    pub success: bool,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ConnectionStatus {
    pub connected: bool,
    pub host: Option<String>,
    pub username: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ConnectResult {
    pub success: bool,
    pub error: Option<String>,
}

struct ActiveConnection {
    session: Session,
    config: SshConfig,
}

static SSH_CONNECTION: Lazy<RwLock<Option<ActiveConnection>>> = Lazy::new(|| RwLock::new(None));

fn establish_connection(config: &SshConfig) -> Result<Session, String> {
    let tcp = TcpStream::connect(format!("{}:{}", config.host, config.port))
        .map_err(|e| format!("无法连接到服务器: {}", e))?;

    let mut session = Session::new()
        .map_err(|e| format!("创建 SSH 会话失败: {}", e))?;

    session.set_tcp_stream(tcp);
    session.handshake()
        .map_err(|e| format!("SSH 握手失败: {}", e))?;

    if config.auth_type == "password" {
        if let Some(ref password) = config.password {
            session.userauth_password(&config.username, password)
                .map_err(|e| format!("密码认证失败: {}", e))?;
        } else {
            return Err("未提供密码，请在客户端输入密码".to_string());
        }
    } else if config.auth_type == "key" {
        if let Some(ref private_key) = config.private_key {
            userauth_with_private_key_string(&session, &config.username, private_key)
                .map_err(|e| format!("密钥认证失败: {}", e))?;
        } else {
            return Err("未提供私钥".to_string());
        }
    } else {
        return Err("无效的认证类型".to_string());
    }

    Ok(session)
}

pub fn connect_ssh(config: &SshConfig) -> ConnectResult {
    match establish_connection(config) {
        Ok(session) => {
            let conn = ActiveConnection {
                session,
                config: config.clone(),
            };
            *SSH_CONNECTION.write().unwrap() = Some(conn);
            ConnectResult {
                success: true,
                error: None,
            }
        }
        Err(e) => ConnectResult {
            success: false,
            error: Some(e),
        },
    }
}

pub fn disconnect_ssh() -> Result<String, String> {
    let mut conn = SSH_CONNECTION.write().unwrap();
    let status = if let Some(ref conn) = *conn {
        format!("已断开与 {} 的连接", conn.config.host)
    } else {
        "未连接到任何服务器".to_string()
    };
    *conn = None;
    Ok(status)
}

pub fn get_ssh_status() -> ConnectionStatus {
    let conn = SSH_CONNECTION.read().unwrap();
    match &*conn {
        Some(c) => ConnectionStatus {
            connected: true,
            host: Some(c.config.host.clone()),
            username: Some(c.config.username.clone()),
        },
        None => ConnectionStatus {
            connected: false,
            host: None,
            username: None,
        },
    }
}

fn with_session<F, R>(config: &SshConfig, f: F) -> Result<R, String>
where
    F: FnOnce(&Session) -> Result<R, String>,
{
    let conn = SSH_CONNECTION.read().unwrap();
    if let Some(ref active_conn) = *conn {
        if active_conn.config.host == config.host
            && active_conn.config.port == config.port
            && active_conn.config.username == config.username
        {
            return f(&active_conn.session);
        }
    }
    drop(conn);
    let session = establish_connection(config)?;
    f(&session)
}

pub fn test_ssh_connection(config: &SshConfig) -> SshTestResult {
    let conn = SSH_CONNECTION.read().unwrap();
    if let Some(ref active_conn) = *conn {
        if active_conn.config.host == config.host
            && active_conn.config.port == config.port
            && active_conn.config.username == config.username
        {
            return SshTestResult {
                success: true,
                error: None,
            };
        }
    }
    drop(conn);

    match establish_connection(config) {
        Ok(_) => SshTestResult {
            success: true,
            error: None,
        },
        Err(e) => SshTestResult {
            success: false,
            error: Some(e),
        },
    }
}

pub fn upload_bytes_via_ssh(
    config: &SshConfig,
    remote_path: &str,
    data: &[u8],
) -> Result<(), String> {
    with_session(config, |session| {
        let sftp = session.sftp()
            .map_err(|e| format!("创建 SFTP 会话失败: {}", e))?;

        let mut remote_file = None;
        let mut last_err = None;

        for candidate in sftp_path_variants(remote_path) {
            match sftp.create(Path::new(&candidate)) {
                Ok(file) => {
                    remote_file = Some(file);
                    last_err = None;
                    break;
                }
                Err(e) => {
                    last_err = Some(format!("{} (路径: {})", e, candidate));
                }
            }
        }

        let mut remote_file = remote_file
            .ok_or_else(|| format!("创建远程文件失败: {}", last_err.unwrap_or_else(|| "未知错误".to_string())))?;

        remote_file
            .write_all(data)
            .map_err(|e| format!("写入远程文件失败: {}", e))?;

        Ok(())
    })
}

/// 通过 SSH 上传文件（文本内容）
pub fn upload_file_via_ssh(
    config: &SshConfig,
    remote_path: &str,
    content: &str,
) -> Result<(), String> {
    upload_bytes_via_ssh(config, remote_path, content.as_bytes())
}

/// 创建远程目录
pub fn create_remote_directory(config: &SshConfig, remote_dir: &str) -> Result<(), String> {
    with_session(config, |session| {
        let mkdir_cmd = format!(
            r#"New-Item -ItemType Directory -Force -Path "{}""#,
            remote_dir.replace('\\', "/")
        );

        let mut channel = session.channel_session()
            .map_err(|e| format!("创建通道失败: {}", e))?;

        channel.exec(format!("powershell.exe -Command {}", mkdir_cmd).as_str())
            .map_err(|e| format!("执行创建目录命令失败: {}", e))?;

        channel.wait_close().ok();

        Ok(())
    })
}

fn userauth_with_private_key_string(session: &Session, username: &str, private_key_pem: &str) -> Result<(), String> {
    // ssh2 crate 只提供基于文件路径的私钥认证，因此写入临时文件再调用 userauth_pubkey_file
    let mut dir = dirs::home_dir().ok_or_else(|| "无法获取用户目录".to_string())?;
    dir.push(".acc-config-generator");
    dir.push("tmp");
    fs::create_dir_all(&dir).map_err(|e| format!("创建临时目录失败: {}", e))?;

    let ts = SystemTime::now().duration_since(UNIX_EPOCH).map_err(|e| e.to_string())?.as_millis();
    let mut key_path = dir;
    key_path.push(format!("ssh_key_{}.pem", ts));

    fs::write(&key_path, private_key_pem).map_err(|e| format!("写入临时私钥失败: {}", e))?;

    let result = session
        .userauth_pubkey_file(username, None, &key_path, None)
        .map_err(|e| format!("userauth_pubkey_file 失败: {}", e));

    // 尽量清理临时文件
    let _ = fs::remove_file(&key_path);

    result
}

/// 部署配置到远程服务器
pub fn deploy_configs(
    config: &SshConfig,
    options: &DeployOptions,
    configs: &serde_json::Value,
) -> DeployResult {
    let server_path = normalize_windows_path(options.server_path.as_deref().unwrap_or("C:/ACC_Server"));
    let cfg_path = format!("{}\\cfg", server_path);

    // 创建 cfg 目录（使用 SSH 命令确保目录存在）
    if let Err(e) = create_remote_directory(config, &cfg_path) {
        return DeployResult {
            success: false,
            error: Some(format!("创建 cfg 目录失败: {}", e)),
        };
    }

    // 定义配置文件
    let config_files = vec![
        ("configuration.json", "configuration"),
        ("settings.json", "settings"),
        ("event.json", "event"),
        ("eventRules.json", "eventRules"),
        ("assistRules.json", "assistRules"),
        ("entrylist.json", "entryList"),
        ("bop.json", "bop"),
    ];

    // 上传每个配置文件
    for (filename, key) in config_files {
        if let Some(config_content) = configs.get(key) {
            let content = serde_json::to_string_pretty(config_content)
                .unwrap_or_else(|_| "{}".to_string());
            
            let remote_path = format!("{}\\{}", cfg_path, filename);
            match upload_file_via_ssh(config, &remote_path, &content) {
                Ok(_) => {},
                Err(e) => return DeployResult {
                    success: false,
                    error: Some(format!("上传 {} 失败: {}", filename, e)),
                },
            }
        }
    }

    // 如果需要启动服务器
    if options.start_server {
        let server_exe_path = format!("{}\\accServer.exe", server_path);
        let command = format!(
            "Start-Process -FilePath \"{}\" -WorkingDirectory \"{}\"",
            server_exe_path, server_path
        );
        
        match upload_file_via_ssh(config, &format!("{}\\.start", server_path), &command) {
            Ok(_) => {},
            Err(e) => {
                eprintln!("启动服务器警告: {}", e);
            },
        }
    }

    DeployResult {
        success: true,
        error: None,
    }
}

/// 通过SSH下载ACC服务器
pub fn download_acc_server(
    config: &SshConfig,
    server_path: &str,
    download_url: &str,
) -> Result<String, String> {
    with_session(config, |session| {
        let mkdir_cmd = format!(
            "New-Item -ItemType Directory -Force -Path \"{}\"",
            server_path
        );

        let mut channel = session.channel_session()
            .map_err(|e| format!("创建通道失败: {}", e))?;

        channel.exec(format!("powershell.exe -Command {}", mkdir_cmd).as_str())
            .map_err(|e| format!("执行命令失败: {}", e))?;

        channel.wait_close().ok();

        let download_cmd = format!(
            r#"$zipPath = Join-Path $env:TEMP "acc_server.zip"; $url = "{}"; $dest = "{}"; try {{ if (Get-Command curl.exe -ErrorAction SilentlyContinue) {{ & curl.exe -L -f -S -o $zipPath $url --connect-timeout 60 --max-time 300; if ($LASTEXITCODE -ne 0) {{ Write-Host "ERROR: curl.exe failed, exit=$LASTEXITCODE"; exit 1 }} }} else {{ [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri $url -OutFile $zipPath -UseBasicParsing -TimeoutSec 300 -MaximumRedirection 10 }}; if (Test-Path $zipPath) {{ $size = (Get-Item $zipPath).Length; Write-Host "文件下载成功，大小: $size 字节"; if ($size -lt 1000000) {{ Write-Host "WARNING: 文件太小，可能不是有效的ZIP文件" }} }} else {{ Write-Host "ERROR: 文件下载失败"; exit 1 }} }} catch {{ Write-Host "ERROR: 下载失败"; Write-Host $_.Exception.Message; exit 1 }}; if (Test-Path $zipPath) {{ try {{ Write-Host "开始解压..."; Expand-Archive -Path $zipPath -DestinationPath $dest -Force; Remove-Item $zipPath -Force; Write-Host "解压成功" }} catch {{ Write-Host "ERROR: 解压失败"; Write-Host $_.Exception.Message; exit 1 }} }} else {{ Write-Host "ERROR: 文件不存在"; exit 1 }}"#,
            download_url, server_path
        );

        let mut channel = session.channel_session()
            .map_err(|e| format!("创建通道失败: {}", e))?;

        channel.exec(format!("powershell.exe -Command {}", download_cmd).as_str())
            .map_err(|e| format!("执行下载命令失败: {}", e))?;

        let mut output = Vec::new();
        let mut stderr = Vec::new();
        channel.read_to_end(&mut output).ok();
        channel.stderr().read_to_end(&mut stderr).ok();
        channel.wait_close().ok();

        let output_str = String::from_utf8_lossy(&output);
        let stderr_str = String::from_utf8_lossy(&stderr);

        if let Ok(exit_code) = channel.exit_status() {
            if exit_code != 0 {
                return Err(format!("下载服务器失败 (退出代码: {}):\nstdout: {}\nstderr: {}", 
                    exit_code, output_str.trim(), stderr_str.trim()));
            }
        }

        if !stderr_str.is_empty() && stderr_str.contains("错误") {
            return Err(format!("下载服务器警告:\nstdout: {}\nstderr: {}", 
                output_str.trim(), stderr_str.trim()));
        }

        if !output_str.is_empty() {
            Ok(format!("ACC服务器下载完成: {}", output_str.trim()))
        } else {
            Ok("ACC服务器下载完成".to_string())
        }
    })
}

pub fn upload_acc_server_from_local(
    config: &SshConfig,
    server_path: &str,
    local_zip_path: &str,
) -> Result<String, String> {
    let zip_data = fs::read(local_zip_path)
        .map_err(|e| format!("读取本地文件失败: {}", e))?;
    
    let file_size = zip_data.len();
    
    if file_size < 1_000_000 {
        return Err(format!("文件太小 ({}字节)，可能不是有效的ACC服务器安装包", file_size));
    }

    if !local_zip_path.to_lowercase().ends_with(".zip") {
        return Err("文件必须是 .zip 格式".to_string());
    }

    with_session(config, |session| {
        let server_path = normalize_windows_path(server_path);
        
        let mkdir_cmd = format!(
            r#"New-Item -ItemType Directory -Force -Path "{}""#,
            server_path
        );

        let mut channel = session.channel_session()
            .map_err(|e| format!("创建通道失败: {}", e))?;

        channel.exec(format!("powershell.exe -Command {}", mkdir_cmd).as_str())
            .map_err(|e| format!("执行创建目录命令失败: {}", e))?;

        channel.wait_close().ok();

        let remote_zip_path = format!("{}\\acc-server.zip", server_path);

        let delete_old_zip_cmd = format!(
            r#"if (Test-Path "{}") {{ Remove-Item "{}" -Force }}"#,
            remote_zip_path,
            remote_zip_path
        );

        let mut delete_channel = session.channel_session()
            .map_err(|e| format!("创建删除旧文件通道失败: {}", e))?;

        delete_channel.exec(format!("powershell.exe -Command {}", delete_old_zip_cmd).as_str())
            .map_err(|e| format!("执行删除旧文件命令失败: {}", e))?;

        delete_channel.wait_close().ok();

        let sftp = session.sftp()
            .map_err(|e| format!("创建 SFTP 会话失败: {}", e))?;

        let mut remote_file = None;
        let mut last_err = None;

        for candidate in sftp_path_variants(&remote_zip_path) {
            match sftp.create(Path::new(&candidate)) {
                Ok(file) => {
                    remote_file = Some(file);
                    last_err = None;
                    break;
                }
                Err(e) => {
                    last_err = Some(format!("{} (路径: {})", e, candidate));
                }
            }
        }

        let mut remote_file = remote_file
            .ok_or_else(|| format!("创建远程文件失败: {}", last_err.unwrap_or_else(|| "未知错误".to_string())))?;

        remote_file
            .write_all(&zip_data)
            .map_err(|e| format!("写入远程文件失败: {}", e))?;

        remote_file.flush().ok();
        drop(remote_file);
        drop(sftp);

        let wait_cmd = "Start-Sleep -Seconds 3";

        let mut wait_channel = session.channel_session()
            .map_err(|e| format!("创建等待通道失败: {}", e))?;

        wait_channel.exec(format!("powershell.exe -Command {}", wait_cmd).as_str())
            .map_err(|e| format!("执行等待命令失败: {}", e))?;

        wait_channel.wait_close().ok();

        let extract_cmd = format!(
            r#"$ErrorActionPreference = 'Stop'; try {{ Write-Host '开始解压...'; Expand-Archive -LiteralPath '{}' -DestinationPath '{}' -Force; Write-Host '解压成功'; Write-Host 'DONE' }} catch {{ Write-Host ('解压失败: ' + $_.Exception.Message); Write-Host 'FAILED'; exit 1 }}"#,
            remote_zip_path,
            server_path
        );

        let mut channel = session.channel_session()
            .map_err(|e| format!("创建解压通道失败: {}", e))?;

        channel.exec(format!("powershell.exe -Command {}", extract_cmd).as_str())
            .map_err(|e| format!("执行解压命令失败: {}", e))?;

        let mut output = Vec::new();
        let mut stderr = Vec::new();
        channel.read_to_end(&mut output).ok();
        channel.stderr().read_to_end(&mut stderr).ok();
        channel.wait_close().ok();

        let output_str = String::from_utf8_lossy(&output);
        let stderr_str = String::from_utf8_lossy(&stderr);

        let exit_code = channel.exit_status().unwrap_or(255);
        
        if exit_code != 0 || !output_str.contains("DONE") {
            return Err(format!("解压ACC服务器失败 (退出代码: {}, OUTPUT={}, STDERR={})", 
                exit_code, output_str.trim(), stderr_str.trim()));
        }

        if output_str.contains("FAILED") {
            return Err(format!("解压失败: {}", output_str.trim()));
        }

        let delete_cmd = format!(
            r#"Start-Sleep -Seconds 1; Remove-Item -LiteralPath '{}' -Force -ErrorAction SilentlyContinue; if (Test-Path '{}') {{ Write-Host 'ZIP_DELETE_FAILED' }} else {{ Write-Host 'ZIP_DELETED' }}"#,
            remote_zip_path,
            remote_zip_path
        );

        let mut delete_channel = session.channel_session()
            .map_err(|e| format!("创建删除通道失败: {}", e))?;

        delete_channel.exec(format!("powershell.exe -Command {}", delete_cmd).as_str())
            .map_err(|e| format!("执行删除命令失败: {}", e))?;

        delete_channel.wait_close().ok();

        // 用注册表路径确认 VC++ 2015-2022 x64 Runtime 是否真正安装成功
        let install_ps = format!(
            concat!(
                "$ErrorActionPreference = 'Continue'; ",
                "$vcPath = Get-ChildItem -Path '{}' -Filter 'VC_redist.x64.exe' -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1; ",
                "if (-not $vcPath) {{ Write-Host 'VC_REDIST_NOT_FOUND'; exit 0 }}; ",
                "Write-Host ('Found VC_redist: ' + $vcPath.FullName); ",
                // 通过计划任务以 SYSTEM 权限运行，规避 SSH Session 0 UAC 限制
                "$taskName = 'VCRedist_' + (Get-Random); ",
                "$action = New-ScheduledTaskAction -Execute $vcPath.FullName -Argument '/install /quiet /norestart'; ",
                "$principal = New-ScheduledTaskPrincipal -UserId 'SYSTEM' -RunLevel Highest; ",
                "Register-ScheduledTask -TaskName $taskName -Action $action -Principal $principal -Force | Out-Null; ",
                "Start-ScheduledTask -TaskName $taskName; ",
                // 等待任务完成（最多 120 秒）
                "$waited = 0; ",
                "do {{ Start-Sleep -Seconds 2; $waited += 2; $state = (Get-ScheduledTask -TaskName $taskName).State }} while ($state -eq 'Running' -and $waited -lt 120); ",
                "$info = Get-ScheduledTaskInfo -TaskName $taskName; ",
                "$exitCode = $info.LastTaskResult; ",
                "Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue; ",
                "Write-Host ('VC_redist task result: ' + $exitCode); ",
                // 用注册表确认是否真正安装（VC++ 2015-2022 x64 DisplayVersion >= 14）
                "$regPaths = @(",
                "  'HKLM:\\SOFTWARE\\Microsoft\\VisualStudio\\14.0\\VC\\Runtimes\\x64',",
                "  'HKLM:\\SOFTWARE\\WOW6432Node\\Microsoft\\VisualStudio\\14.0\\VC\\Runtimes\\x64'",
                "); ",
                "$installed = $false; ",
                "foreach ($p in $regPaths) {{ if (Test-Path $p) {{ $ver = (Get-ItemProperty $p -ErrorAction SilentlyContinue).Version; if ($ver) {{ Write-Host ('Registry version: ' + $ver); $installed = $true }} }} }}; ",
                "if ($installed) {{ Write-Host 'VC_REDIST_INSTALLED' }} ",
                "elseif ($exitCode -eq 0 -or $exitCode -eq 3010) {{ Write-Host 'VC_REDIST_INSTALLED' }} ",
                "else {{ Write-Host 'VC_REDIST_FAILED' }}"
            ),
            server_path
        );

        let mut install_channel = session.channel_session()
            .map_err(|e| format!("创建安装通道失败: {}", e))?;

        let install_cmd = format!(
            "powershell.exe -NoProfile -ExecutionPolicy Bypass -EncodedCommand {}",
            encode_powershell_command(&install_ps)
        );

        install_channel.exec(&install_cmd)
            .map_err(|e| format!("执行安装命令失败: {}", e))?;

        let mut install_output = Vec::new();
        let mut install_stderr = Vec::new();
        install_channel.read_to_end(&mut install_output).ok();
        install_channel.stderr().read_to_end(&mut install_stderr).ok();
        install_channel.wait_close().ok();

        let install_output_str = String::from_utf8_lossy(&install_output);
        let _install_stderr_str = String::from_utf8_lossy(&install_stderr);

        if install_output_str.contains("VC_REDIST_FAILED") {
            return Err(format!("VC_redist安装失败: {}", install_output_str.trim()));
        }

        if install_output_str.contains("VC_REDIST_NOT_FOUND") {
            return Ok(format!("ACC服务器上传并解压完成，未找到VC_redist安装包 ({}字节)", file_size));
        }

        if install_output_str.contains("VC_REDIST_INSTALLED") {
            return Ok(format!("ACC服务器上传、解压并安装完成，VC_redist安装成功 ({}字节)", file_size));
        }

        Ok(format!("ACC服务器上传并解压完成 ({}字节)", file_size))
    })
}

/// 启动ACC服务器
///
/// 通过 Windows 计划任务启动 accServer.exe。
/// Windows OpenSSH 会将 SSH channel 的所有子进程放入 Job Object，
/// channel 关闭时 Job Object 会终止所有子进程。
/// 计划任务在独立会话中运行，不受 Job Object 管控，进程可持久存活。
pub fn start_acc_server(
    config: &SshConfig,
    server_path: &str,
) -> Result<String, String> {
    with_session(config, |session| {
        let normalized_path = normalize_windows_path(server_path);

        let ps_script = format!(
            concat!(
                "$ErrorActionPreference = 'Stop'; ",
                "$existing = Get-Process accServer -ErrorAction SilentlyContinue; ",
                "if ($existing) {{ throw 'ACC服务器已在运行中 (PID: ' + ($existing.Id -join ',') + ')' }}; ",
                "$taskName = 'ACCServer_' + (Get-Random); ",
                "$action = New-ScheduledTaskAction -Execute '{}\\accServer.exe' -WorkingDirectory '{}'; ",
                "Register-ScheduledTask -TaskName $taskName -Action $action -Force | Out-Null; ",
                "Start-ScheduledTask -TaskName $taskName; ",
                "Start-Sleep -Seconds 3; ",
                "Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue; ",
                "$proc = Get-Process accServer -ErrorAction SilentlyContinue | Select-Object -First 1; ",
                "if ($proc) {{ Write-Output $proc.Id }} else {{ throw 'ACC服务器启动失败：进程未运行，请检查服务器配置文件。' }}"
            ),
            normalized_path, normalized_path
        );

        let cmd = format!(
            "powershell.exe -NoProfile -ExecutionPolicy Bypass -EncodedCommand {}",
            encode_powershell_command(&ps_script)
        );

        let mut channel = session.channel_session()
            .map_err(|e| format!("创建通道失败: {}", e))?;
        channel.exec(&cmd)
            .map_err(|e| format!("执行启动命令失败: {}", e))?;

        let mut stdout = Vec::new();
        let mut stderr = Vec::new();
        channel.read_to_end(&mut stdout).ok();
        channel.stderr().read_to_end(&mut stderr).ok();
        channel.wait_close().ok();

        let out = String::from_utf8_lossy(&stdout).trim().to_string();
        let err = String::from_utf8_lossy(&stderr);

        let exit_code = channel.exit_status().unwrap_or(-1);
        if exit_code != 0 || out.is_empty() {
            let mut msg = if err.trim().is_empty() || err.contains("CLIXML") {
                format!("启动失败 (exit={})", exit_code)
            } else {
                err.trim().to_string()
            };
            if !out.is_empty() {
                msg.push_str(&format!("\nstdout: {}", out));
            }
            return Err(msg);
        }

        Ok(format!("ACC服务器启动成功 (PID: {})", out))
    })
}

/// 停止ACC服务器
pub fn stop_acc_server(
    config: &SshConfig,
) -> Result<String, String> {
    with_session(config, |session| {
        let ps_script = concat!(
            "$ErrorActionPreference = 'Stop'; ",
            "$procs = Get-Process accServer -ErrorAction SilentlyContinue; ",
            "if (-not $procs) { throw '服务器未在运行中' }; ",
            "$pids = $procs.Id -join ','; ",
            "$procs | Stop-Process -Force; ",
            "Start-Sleep -Seconds 2; ",
            "$remaining = Get-Process accServer -ErrorAction SilentlyContinue; ",
            "if ($remaining) { throw '服务器未能停止 (PID: ' + ($remaining.Id -join ',') + ')' }; ",
            "Write-Output ('STOPPED:' + $pids)"
        );

        let cmd = format!(
            "powershell.exe -NoProfile -ExecutionPolicy Bypass -EncodedCommand {}",
            encode_powershell_command(ps_script)
        );

        let mut channel = session.channel_session()
            .map_err(|e| format!("创建通道失败: {}", e))?;

        channel.exec(&cmd)
            .map_err(|e| format!("执行停止命令失败: {}", e))?;

        let mut stdout = Vec::new();
        let mut stderr = Vec::new();
        channel.read_to_end(&mut stdout).ok();
        channel.stderr().read_to_end(&mut stderr).ok();
        channel.wait_close().ok();

        let out = String::from_utf8_lossy(&stdout).trim().to_string();
        let err = String::from_utf8_lossy(&stderr);

        let exit_code = channel.exit_status().unwrap_or(-1);
        if exit_code != 0 {
            let msg = if err.trim().is_empty() || err.contains("CLIXML") {
                if out.is_empty() {
                    format!("停止失败 (exit={})", exit_code)
                } else {
                    out.clone()
                }
            } else {
                err.trim().to_string()
            };
            return Err(msg);
        }

        if out.starts_with("STOPPED:") {
            let killed_pids = out.trim_start_matches("STOPPED:");
            Ok(format!("ACC服务器已停止 (PID: {})", killed_pids))
        } else {
            Ok("ACC服务器已停止".to_string())
        }
    })
}

/// 检测ACC服务器进程是否在运行
pub fn check_acc_server_running(config: &SshConfig) -> Result<bool, String> {
    with_session(config, |session| {
        let ps_script = concat!(
            "$proc = Get-Process accServer -ErrorAction SilentlyContinue | Select-Object -First 1; ",
            "if ($proc) { Write-Output ('RUNNING:' + $proc.Id) } else { Write-Output 'STOPPED' }"
        );

        let cmd = format!(
            "powershell.exe -NoProfile -ExecutionPolicy Bypass -EncodedCommand {}",
            encode_powershell_command(ps_script)
        );

        let mut channel = session.channel_session()
            .map_err(|e| format!("创建通道失败: {}", e))?;
        channel.exec(&cmd)
            .map_err(|e| format!("执行检测命令失败: {}", e))?;

        let mut stdout = Vec::new();
        channel.read_to_end(&mut stdout).ok();
        channel.wait_close().ok();

        let out = String::from_utf8_lossy(&stdout).trim().to_string();
        Ok(out.starts_with("RUNNING:"))
    })
}

pub fn download_results(
    config: &SshConfig,
    server_path: &str,
    local_path: &str,
) -> Result<String, String> {
    with_session(config, |session| {
        let server_path = normalize_windows_path(server_path);
        
        let check_cmd = format!(
            "Test-Path \"{}\\results\"",
            server_path
        );

        let mut channel = session.channel_session()
            .map_err(|e| format!("创建通道失败: {}", e))?;

        channel.exec(format!("powershell.exe -Command {}", check_cmd).as_str())
            .map_err(|e| format!("执行检查命令失败: {}", e))?;

        let mut output = Vec::new();
        channel.read_to_end(&mut output).ok();
        channel.wait_close().ok();

        let output_str = String::from_utf8_lossy(&output);

        if !output_str.trim().contains("True") {
            return Err("Results目录不存在".to_string());
        }

        let results_dir = Path::new(local_path);
        fs::create_dir_all(results_dir)
            .map_err(|e| format!("创建本地目录失败: {}", e))?;

        let sftp = session.sftp()
            .map_err(|e| format!("创建SFTP会话失败: {}", e))?;

        let remote_results_path = format!("{}\\results", server_path);

        download_directory_recursive(&sftp, &remote_results_path, local_path)?;

        Ok(format!("赛后报告已下载到: {}", local_path))
    })
}

/// 删除远程配置文件夹
pub fn delete_config_folder(
    config: &SshConfig,
    server_path: &str,
) -> Result<DeployResult, String> {
    with_session(config, |session| {
        let server_path = normalize_windows_path(server_path);
        let cfg_path = format!("{}\\cfg", server_path);
        
        let check_cmd = format!(
            r#"if (Test-Path "{}") {{ Write-Host "EXISTS" }} else {{ Write-Host "NOT_EXISTS" }}"#,
            cfg_path
        );

        let mut check_channel = session.channel_session()
            .map_err(|e| format!("创建检查通道失败: {}", e))?;

        check_channel.exec(format!("powershell.exe -Command {}", check_cmd).as_str())
            .map_err(|e| format!("执行检查命令失败: {}", e))?;

        let mut check_output = Vec::new();
        check_channel.read_to_end(&mut check_output).ok();
        check_channel.wait_close().ok();

        let check_output_str = String::from_utf8_lossy(&check_output);

        if check_output_str.trim().contains("NOT_EXISTS") {
            return Ok(DeployResult {
                success: true,
                error: Some("配置文件目录不存在，无需删除".to_string()),
            });
        }

        let delete_cmd = format!(
            r#"Remove-Item -Path "{}" -Recurse -Force -ErrorAction SilentlyContinue; if (Test-Path "{}") {{ Write-Host "DELETE_FAILED" }} else {{ Write-Host "DELETE_SUCCESS" }}"#,
            cfg_path,
            cfg_path
        );

        let mut channel = session.channel_session()
            .map_err(|e| format!("创建删除通道失败: {}", e))?;

        channel.exec(format!("powershell.exe -Command {}", delete_cmd).as_str())
            .map_err(|e| format!("执行删除命令失败: {}", e))?;

        let mut output = Vec::new();
        let mut stderr = Vec::new();
        channel.read_to_end(&mut output).ok();
        channel.stderr().read_to_end(&mut stderr).ok();
        channel.wait_close().ok();

        let output_str = String::from_utf8_lossy(&output);
        let _stderr_str = String::from_utf8_lossy(&stderr);

        if output_str.trim().contains("DELETE_FAILED") {
            return Err("删除配置文件目录失败".to_string());
        }

        Ok(DeployResult {
            success: true,
            error: None,
        })
    })
}

/// 下载过滤后的比赛结果（只下载 _Q 和 _R 结尾的 JSON 文件）
pub fn download_results_filtered(
    config: &SshConfig,
    server_path: &str,
    local_path: &str,
) -> Result<Value, String> {
    with_session(config, |session| {
        let server_path = normalize_windows_path(server_path);
        
        let check_cmd = format!(
            "Test-Path \"{}\\results\"",
            server_path
        );

        let mut channel = session.channel_session()
            .map_err(|e| format!("创建通道失败: {}", e))?;

        channel.exec(format!("powershell.exe -Command {}", check_cmd).as_str())
            .map_err(|e| format!("执行检查命令失败: {}", e))?;

        let mut output = Vec::new();
        channel.read_to_end(&mut output).ok();
        channel.wait_close().ok();

        let output_str = String::from_utf8_lossy(&output);

        if !output_str.trim().contains("True") {
            return Err("Results目录不存在".to_string());
        }

        let results_dir = Path::new(local_path);
        fs::create_dir_all(results_dir)
            .map_err(|e| format!("创建本地目录失败: {}", e))?;

        let sftp = session.sftp()
            .map_err(|e| format!("创建SFTP会话失败: {}", e))?;

        let remote_results_path = format!("{}\\results", server_path);

        let downloaded_files = download_filtered_json_files(&sftp, &remote_results_path, local_path)?;

        let result = serde_json::json!({
            "success": true,
            "files": downloaded_files
        });

        Ok(result)
    })
}

/// 递归下载过滤后的JSON文件（只下载 _Q.json 和 _R.json）
fn download_filtered_json_files(
    sftp: &ssh2::Sftp,
    remote_dir: &str,
    local_dir: &str,
) -> Result<Vec<String>, String> {
    let remote_path = Path::new(remote_dir);
    let local_path = Path::new(local_dir);
    let mut downloaded_files = Vec::new();

    let dir = sftp.readdir(remote_path)
        .map_err(|e| format!("读取远程目录失败: {}", e))?;

    for (path, stat) in dir {
        let file_name = path.file_name()
            .ok_or_else(|| "无法获取文件名".to_string())?
            .to_str()
            .ok_or_else(|| "文件名包含无效字符".to_string())?;

        if file_name == "." || file_name == ".." {
            continue;
        }

        let local_file_path = local_path.join(file_name);

        if stat.is_dir() {
            let remote_subdir = format!("{}/{}", remote_dir, file_name);
            let local_subdir = local_file_path.to_string_lossy().to_string();
            let sub_files = download_filtered_json_files(sftp, &remote_subdir, &local_subdir)?;
            downloaded_files.extend(sub_files);
        } else {
            let file_name_lower = file_name.to_lowercase();
            if file_name_lower.ends_with("_q.json") || file_name_lower.ends_with("_r.json") {
                let mut remote_file = sftp.open(&path)
                    .map_err(|e| format!("打开远程文件失败: {}", e))?;

                let mut content = Vec::new();
                remote_file.read_to_end(&mut content)
                    .map_err(|e| format!("读取远程文件失败: {}", e))?;

                fs::write(&local_file_path, content)
                    .map_err(|e| format!("写入本地文件失败: {}", e))?;
                
                downloaded_files.push(file_name.to_string());
            }
        }
    }

    Ok(downloaded_files)
}

/// 从远程服务器 cfg 目录读取并解析所有配置文件
pub fn download_server_cfg_configs(
    config: &SshConfig,
    server_path: &str,
) -> Result<Value, String> {
    with_session(config, |session| {
        let server_path = normalize_windows_path(server_path);
        let cfg_path = format!("{}\\cfg", server_path);

        // 检查 cfg 目录是否存在
        let check_cmd = format!(
            r#"if (Test-Path "{}") {{ Write-Host "EXISTS" }} else {{ Write-Host "NOT_EXISTS" }}"#,
            cfg_path
        );

        let mut check_channel = session.channel_session()
            .map_err(|e| format!("创建检查通道失败: {}", e))?;
        check_channel.exec(format!("powershell.exe -Command {}", check_cmd).as_str())
            .map_err(|e| format!("执行检查命令失败: {}", e))?;
        let mut check_output = Vec::new();
        check_channel.read_to_end(&mut check_output).ok();
        check_channel.wait_close().ok();
        let check_output_str = String::from_utf8_lossy(&check_output);
        if !check_output_str.trim().contains("EXISTS") {
            return Err("服务器 cfg 目录不存在".to_string());
        }

        let sftp = session.sftp()
            .map_err(|e| format!("创建 SFTP 会话失败: {}", e))?;

        // 文件名 -> AllConfigs 键名映射
        let file_keys = vec![
            ("configuration.json", "configuration"),
            ("settings.json", "settings"),
            ("event.json", "event"),
            ("eventRules.json", "eventRules"),
            ("assistRules.json", "assistRules"),
            ("entrylist.json", "entryList"),
            ("bop.json", "bop"),
        ];

        let mut configs_map = serde_json::Map::new();
        let mut loaded_files: Vec<String> = Vec::new();
        let mut missing_files: Vec<String> = Vec::new();
        for (filename, key) in &file_keys {
            let remote_file_path = format!("{}/{}", cfg_path.replace('\\', "/"), filename);

            let mut remote_file = match sftp.open(Path::new(&remote_file_path)) {
                Ok(f) => f,
                Err(_) => {
                    missing_files.push((*filename).to_string());
                    continue;
                }
            };

            let mut content = Vec::new();
            remote_file.read_to_end(&mut content)
                .map_err(|e| format!("读取 {} 内容失败: {}", filename, e))?;

            let json_str = String::from_utf8_lossy(&content);
            let json_value: serde_json::Value = serde_json::from_str(&json_str)
                .map_err(|e| format!("解析 {} JSON 失败: {}", filename, e))?;

            configs_map.insert(key.to_string(), json_value);
            loaded_files.push((*filename).to_string());
        }

        if configs_map.is_empty() {
            return Err("未在服务器 cfg 目录读取到可用的 JSON 配置文件".to_string());
        }

        let result = serde_json::json!({
            "success": true,
            "configs": Value::Object(configs_map),
            "loaded_files": loaded_files,
            "missing_files": missing_files
        });

        Ok(result)
    })
}

/// 递归下载目录
fn download_directory_recursive(
    sftp: &ssh2::Sftp,
    remote_dir: &str,
    local_dir: &str,
) -> Result<(), String> {
    let remote_path = Path::new(remote_dir);
    let local_path = Path::new(local_dir);

    // 遍历远程目录
    let dir = sftp.readdir(remote_path)
        .map_err(|e| format!("读取远程目录失败: {}", e))?;

    for (path, stat) in dir {
        let file_name = path.file_name()
            .ok_or_else(|| "无法获取文件名".to_string())?
            .to_str()
            .ok_or_else(|| "文件名包含无效字符".to_string())?;

        // 跳过 . 和 ..
        if file_name == "." || file_name == ".." {
            continue;
        }

        let local_file_path = local_path.join(file_name);

        if stat.is_dir() {
            // 递归下载子目录
            let remote_subdir = format!("{}/{}", remote_dir, file_name);
            let local_subdir = local_file_path.to_string_lossy().to_string();
            download_directory_recursive(sftp, &remote_subdir, &local_subdir)?;
        } else {
            // 下载文件
            let mut remote_file = sftp.open(&path)
                .map_err(|e| format!("打开远程文件失败: {}", e))?;

            let mut content = Vec::new();
            remote_file.read_to_end(&mut content)
                .map_err(|e| format!("读取远程文件失败: {}", e))?;

            fs::write(&local_file_path, content)
                .map_err(|e| format!("写入本地文件失败: {}", e))?;
        }
    }

    Ok(())
}
