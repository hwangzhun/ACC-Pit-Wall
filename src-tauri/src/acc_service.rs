use sha2::{Digest, Sha256};
use ssh2::Session;
use std::io::{Read, Write};
use std::path::Path;
use std::thread;
use std::time::{Duration, Instant};

pub(crate) const ACC_SERVICE_NAME: &str = "ACCPitWallServer";
const ACC_SERVICE_WRAPPER_FILENAME: &str = "ACCServerService.exe";
const ACC_SERVICE_CONFIG_FILENAME: &str = "ACCServerService.xml";
const WINSW_VERSION: &str = "2.12.0";
const WINSW_SHA256: &str = "05b82d46ad331cc16bdc00de5c6332c1ef818df8ceefcd49c726553209b3a0da";
const WINSW_BYTES: &[u8] = include_bytes!("../resources/WinSW-x64.exe");

const ACC_SERVICE_XML: &str = r#"<service>
  <id>ACCPitWallServer</id>
  <name>ACC Pit Wall Server</name>
  <description>Assetto Corsa Competizione Dedicated Server managed by ACC Pit Wall</description>
  <executable>%BASE%\accServer.exe</executable>
  <workingdirectory>%BASE%</workingdirectory>
  <startmode>Manual</startmode>
  <serviceaccount>
    <user>LocalSystem</user>
  </serviceaccount>
  <stoptimeout>20sec</stoptimeout>
  <log mode="roll"></log>
</service>
"#;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum ServiceState {
    Stopped,
    StartPending,
    StopPending,
    Running,
    ContinuePending,
    PausePending,
    Paused,
}

impl ServiceState {
    fn from_code(code: u32) -> Option<Self> {
        match code {
            1 => Some(Self::Stopped),
            2 => Some(Self::StartPending),
            3 => Some(Self::StopPending),
            4 => Some(Self::Running),
            5 => Some(Self::ContinuePending),
            6 => Some(Self::PausePending),
            7 => Some(Self::Paused),
            _ => None,
        }
    }

    fn label(self) -> &'static str {
        match self {
            Self::Stopped => "STOPPED",
            Self::StartPending => "START_PENDING",
            Self::StopPending => "STOP_PENDING",
            Self::Running => "RUNNING",
            Self::ContinuePending => "CONTINUE_PENDING",
            Self::PausePending => "PAUSE_PENDING",
            Self::Paused => "PAUSED",
        }
    }

    fn is_active(self) -> bool {
        self != Self::Stopped
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum ServiceQuery {
    Missing,
    Installed(ServiceState),
}

#[derive(Debug)]
struct CommandOutput {
    exit_code: i32,
    stdout: String,
    stderr: String,
}

impl CommandOutput {
    fn combined(&self) -> String {
        match (self.stdout.trim(), self.stderr.trim()) {
            ("", "") => String::new(),
            (stdout, "") => stdout.to_string(),
            ("", stderr) => stderr.to_string(),
            (stdout, stderr) => format!("{}\n{}", stdout, stderr),
        }
    }
}

fn normalize_server_path(path: &str) -> Result<String, String> {
    let normalized = path.trim().replace('/', "\\");
    let bytes = normalized.as_bytes();
    if bytes.len() < 3 || bytes.get(1) != Some(&b':') || bytes.get(2) != Some(&b'\\') {
        return Err("服务器目录必须是绝对 Windows 路径，例如 C:\\ACC_Server".to_string());
    }
    if normalized.contains(['"', '\r', '\n', '%']) {
        return Err("服务器目录包含不受支持的字符（双引号、换行或 %）".to_string());
    }
    Ok(normalized.trim_end_matches('\\').to_string())
}

fn sftp_path_variants(path: &str) -> Vec<String> {
    let slash_path = path.replace('\\', "/");
    let slash_trimmed = slash_path.trim_start_matches('/');
    let mut variants = vec![slash_path.clone(), format!("/{}", slash_trimmed)];
    if let Some((drive, rest)) = slash_trimmed.split_once(":/") {
        variants.push(format!("/{}/{}", drive, rest));
    }
    variants.sort();
    variants.dedup();
    variants
}

fn execute_command(
    session: &Session,
    command: &str,
    context: &str,
) -> Result<CommandOutput, String> {
    let mut channel = session
        .channel_session()
        .map_err(|e| format!("{}：创建 SSH 通道失败: {}", context, e))?;
    channel
        .exec(command)
        .map_err(|e| format!("{}：执行远程命令失败: {}", context, e))?;

    let mut stdout = Vec::new();
    let mut stderr = Vec::new();
    channel
        .read_to_end(&mut stdout)
        .map_err(|e| format!("{}：读取 stdout 失败: {}", context, e))?;
    channel
        .stderr()
        .read_to_end(&mut stderr)
        .map_err(|e| format!("{}：读取 stderr 失败: {}", context, e))?;
    channel
        .wait_close()
        .map_err(|e| format!("{}：等待远程命令结束失败: {}", context, e))?;

    Ok(CommandOutput {
        exit_code: channel.exit_status().unwrap_or(-1),
        stdout: String::from_utf8_lossy(&stdout).trim().to_string(),
        stderr: String::from_utf8_lossy(&stderr).trim().to_string(),
    })
}

fn parse_number_after_marker(text: &str, marker: &str) -> Option<u32> {
    let uppercase = text.to_ascii_uppercase();
    let marker_uppercase = marker.to_ascii_uppercase();
    let index = uppercase.find(&marker_uppercase)?;
    text[index + marker.len()..]
        .split(|c: char| !c.is_ascii_digit())
        .find(|part| !part.is_empty())?
        .parse()
        .ok()
}

fn parse_sc_error_code(output: &str) -> Option<u32> {
    parse_number_after_marker(output, "FAILED")
        .or_else(|| parse_number_after_marker(output, "失败"))
}

fn parse_sc_state(output: &str) -> Option<ServiceState> {
    for line in output.lines() {
        let uppercase = line.to_ascii_uppercase();
        let has_state_marker = uppercase.contains("STATE")
            || line.contains("状态")
            || [
                "STOPPED",
                "START_PENDING",
                "STOP_PENDING",
                "RUNNING",
                "CONTINUE_PENDING",
                "PAUSE_PENDING",
                "PAUSED",
            ]
            .iter()
            .any(|marker| uppercase.contains(marker));
        if has_state_marker {
            let code = line
                .split_once(':')
                .map(|(_, value)| value)
                .unwrap_or(line)
                .split_whitespace()
                .find_map(|part| part.parse::<u32>().ok());
            if let Some(state) = code.and_then(ServiceState::from_code) {
                return Some(state);
            }
        }
    }
    None
}

fn sc_error_code(output: &CommandOutput) -> Option<u32> {
    parse_sc_error_code(&output.combined())
        .or_else(|| (output.exit_code > 0).then_some(output.exit_code as u32))
}

fn query_service(session: &Session) -> Result<ServiceQuery, String> {
    let output = execute_command(
        session,
        &format!("sc.exe query {}", ACC_SERVICE_NAME),
        "查询 ACC 服务",
    )?;
    let combined = output.combined();

    if let Some(error_code) = sc_error_code(&output) {
        return match error_code {
            1060 => Ok(ServiceQuery::Missing),
            5 => Err("查询 ACC 服务失败：访问被拒绝，请使用具有管理员权限的 SSH 账户".to_string()),
            code => Err(format!(
                "查询 ACC 服务失败 (sc.exe 错误码 {}): {}",
                code, combined
            )),
        };
    }
    if let Some(state) = parse_sc_state(&combined) {
        return Ok(ServiceQuery::Installed(state));
    }
    Err(format!(
        "无法解析 ACC 服务状态 (exit={}): {}",
        output.exit_code, combined
    ))
}

fn wrapper_path(server_path: &str) -> String {
    format!("{}\\{}", server_path, ACC_SERVICE_WRAPPER_FILENAME)
}

fn verify_service_path(session: &Session, server_path: &str) -> Result<(), String> {
    let output = execute_command(
        session,
        &format!("sc.exe qc {}", ACC_SERVICE_NAME),
        "读取 ACC 服务配置",
    )?;
    let combined = output.combined();
    if let Some(error_code) = sc_error_code(&output) {
        if error_code == 5 {
            return Err(
                "读取 ACC 服务配置失败：访问被拒绝，请使用具有管理员权限的 SSH 账户".to_string(),
            );
        }
        return Err(format!(
            "读取 ACC 服务配置失败 (sc.exe 错误码 {}): {}",
            error_code, combined
        ));
    }
    if output.exit_code != 0 {
        return Err(format!(
            "读取 ACC 服务配置失败 (exit={}): {}",
            output.exit_code, combined
        ));
    }

    let expected = wrapper_path(server_path).to_ascii_lowercase();
    let normalized_output = combined
        .replace('/', "\\")
        .replace('"', "")
        .to_ascii_lowercase();
    if !normalized_output.contains(&expected) {
        return Err(format!(
            "服务 {} 已存在，但未指向当前目录 {}。当前版本每台服务器只支持一个 ACC 实例，请先移除旧服务或使用原目录。",
            ACC_SERVICE_NAME, server_path
        ));
    }
    Ok(())
}

fn upload_bytes(session: &Session, remote_path: &str, data: &[u8]) -> Result<(), String> {
    let sftp = session
        .sftp()
        .map_err(|e| format!("创建 SFTP 会话失败: {}", e))?;
    let mut remote_file = None;
    let mut last_error = None;
    for candidate in sftp_path_variants(remote_path) {
        match sftp.create(Path::new(&candidate)) {
            Ok(file) => {
                remote_file = Some(file);
                last_error = None;
                break;
            }
            Err(error) => last_error = Some(format!("{} (路径: {})", error, candidate)),
        }
    }
    let mut remote_file = remote_file.ok_or_else(|| {
        format!(
            "创建远程文件失败: {}",
            last_error.unwrap_or_else(|| "未知错误".to_string())
        )
    })?;
    remote_file
        .write_all(data)
        .map_err(|e| format!("写入远程文件失败: {}", e))?;
    remote_file
        .flush()
        .map_err(|e| format!("刷新远程文件失败: {}", e))?;
    Ok(())
}

fn verify_winsw_checksum() -> Result<(), String> {
    let actual = format!("{:x}", Sha256::digest(WINSW_BYTES));
    if actual != WINSW_SHA256 {
        return Err(format!(
            "内置 WinSW {} 校验失败：期望 {}，实际 {}",
            WINSW_VERSION, WINSW_SHA256, actual
        ));
    }
    Ok(())
}

fn upload_service_files(session: &Session, server_path: &str) -> Result<(), String> {
    verify_winsw_checksum()?;
    upload_bytes(session, &wrapper_path(server_path), WINSW_BYTES)?;
    upload_bytes(
        session,
        &format!("{}\\{}", server_path, ACC_SERVICE_CONFIG_FILENAME),
        ACC_SERVICE_XML.as_bytes(),
    )
}

fn run_wrapper_action(
    session: &Session,
    server_path: &str,
    action: &str,
) -> Result<CommandOutput, String> {
    let command = wrapper_action_command(server_path, action);
    execute_command(session, &command, &format!("WinSW {}", action))
}

fn wrapper_action_command(server_path: &str, action: &str) -> String {
    format!(
        r#"cmd.exe /D /S /C ""{}" {}""#,
        wrapper_path(server_path),
        action
    )
}

fn file_exists_command(path: &str) -> String {
    format!(
        r#"cmd.exe /D /C if exist "{}" (exit /B 0) else (exit /B 2)"#,
        path
    )
}

fn remote_file_exists(session: &Session, path: &str) -> Result<bool, String> {
    let output = execute_command(session, &file_exists_command(path), "检查远程文件")?;
    match output.exit_code {
        0 => Ok(true),
        2 => Ok(false),
        code => Err(format!(
            "检查远程文件失败 (exit={}): {}",
            code,
            output.combined()
        )),
    }
}

fn ensure_acc_server_exists(session: &Session, server_path: &str) -> Result<(), String> {
    let executable = format!("{}\\accServer.exe", server_path);
    if !remote_file_exists(session, &executable)? {
        return Err(format!("未找到 ACC 服务器程序: {}", executable));
    }
    Ok(())
}

fn legacy_process_running(session: &Session) -> Result<bool, String> {
    let output = execute_command(
        session,
        r#"tasklist.exe /FI "IMAGENAME eq accServer.exe" /FO CSV /NH"#,
        "检测旧版 ACC 进程",
    )?;
    if output.exit_code != 0 {
        return Err(format!(
            "检测旧版 ACC 进程失败 (exit={}): {}",
            output.exit_code,
            output.combined()
        ));
    }
    Ok(output.stdout.to_ascii_lowercase().contains("accserver.exe"))
}

fn kill_legacy_process(session: &Session) -> Result<bool, String> {
    if !legacy_process_running(session)? {
        return Ok(false);
    }
    let output = execute_command(
        session,
        "taskkill.exe /F /T /IM accServer.exe",
        "停止旧版 ACC 进程",
    )?;
    if output.exit_code != 0 && legacy_process_running(session)? {
        return Err(format!(
            "停止旧版 ACC 进程失败 (exit={}): {}",
            output.exit_code,
            output.combined()
        ));
    }
    Ok(true)
}

fn install_service(session: &Session, server_path: &str) -> Result<ServiceState, String> {
    ensure_acc_server_exists(session, server_path)?;
    upload_service_files(session, server_path)?;
    let output = run_wrapper_action(session, server_path, "install")?;
    let combined = output.combined();
    if output.exit_code != 0 {
        let suffix = parse_sc_error_code(&combined)
            .map(|code| format!("，Windows 错误码 {}", code))
            .unwrap_or_default();
        return Err(format!(
            "安装 ACC Windows 服务失败{} (exit={}): {}。请确认 SSH 账户具有管理员权限。",
            suffix, output.exit_code, combined
        ));
    }
    match query_service(session)? {
        ServiceQuery::Installed(state) => {
            verify_service_path(session, server_path)?;
            Ok(state)
        }
        ServiceQuery::Missing => Err("WinSW 安装命令已完成，但 Windows 服务仍不存在".to_string()),
    }
}

fn refresh_service(session: &Session, server_path: &str) -> Result<(), String> {
    verify_service_path(session, server_path)?;
    upload_service_files(session, server_path)?;
    run_sc_configuration(
        session,
        &service_config_command(),
        "更新 ACC Windows 服务配置",
    )?;
    run_sc_configuration(
        session,
        &service_description_command(),
        "更新 ACC Windows 服务描述",
    )?;
    verify_service_path(session, server_path)?;
    Ok(())
}

fn service_config_command() -> String {
    format!(
        r#"sc.exe config {} start= demand obj= LocalSystem DisplayName= "ACC Pit Wall Server""#,
        ACC_SERVICE_NAME
    )
}

fn service_description_command() -> String {
    format!(
        r#"sc.exe description {} "Assetto Corsa Competizione Dedicated Server managed by ACC Pit Wall""#,
        ACC_SERVICE_NAME
    )
}

fn run_sc_configuration(session: &Session, command: &str, context: &str) -> Result<(), String> {
    let output = execute_command(session, command, context)?;
    if output.exit_code == 0 {
        return Ok(());
    }
    if sc_error_code(&output) == Some(5) {
        return Err(format!(
            "{}失败：访问被拒绝，请使用具有管理员权限的 SSH 账户",
            context
        ));
    }
    Err(format!(
        "{}失败 (exit={}): {}",
        context,
        output.exit_code,
        output.combined()
    ))
}

fn run_sc_action(
    session: &Session,
    action: &str,
    accepted_error_codes: &[u32],
) -> Result<(), String> {
    let output = execute_command(
        session,
        &format!("sc.exe {} {}", action, ACC_SERVICE_NAME),
        &format!("sc.exe {}", action),
    )?;
    let combined = output.combined();
    if output.exit_code == 0 {
        return Ok(());
    }
    if let Some(code) = sc_error_code(&output) {
        if accepted_error_codes.contains(&code) {
            return Ok(());
        }
        if code == 5 {
            return Err(
                "控制 ACC 服务失败：访问被拒绝，请使用具有管理员权限的 SSH 账户".to_string(),
            );
        }
        return Err(format!(
            "sc.exe {} 失败 (Windows 错误码 {}): {}",
            action, code, combined
        ));
    }
    Err(format!(
        "sc.exe {} 失败 (exit={}): {}",
        action, output.exit_code, combined
    ))
}

fn wait_for_state(
    session: &Session,
    expected: ServiceState,
    timeout: Duration,
) -> Result<(), String> {
    let started_at = Instant::now();
    loop {
        match query_service(session)? {
            ServiceQuery::Installed(state) if state == expected => return Ok(()),
            ServiceQuery::Installed(state) if started_at.elapsed() >= timeout => {
                return Err(format!(
                    "等待 ACC 服务进入 {} 超时，当前状态为 {}",
                    expected.label(),
                    state.label()
                ));
            }
            ServiceQuery::Installed(_) => {}
            ServiceQuery::Missing => {
                return Err("等待服务状态时发现 ACC Windows 服务不存在".to_string());
            }
        }
        thread::sleep(Duration::from_millis(500));
    }
}

pub(crate) fn preflight_server_replacement(
    session: &Session,
    server_path: &str,
) -> Result<String, String> {
    let server_path = normalize_server_path(server_path)?;
    match query_service(session)? {
        ServiceQuery::Installed(state) if state.is_active() => {
            return Err(format!(
                "ACC Windows 服务当前处于 {} 状态，请先停止服务器再上传或下载程序",
                state.label()
            ));
        }
        ServiceQuery::Installed(ServiceState::Stopped) => {
            verify_service_path(session, &server_path)?;
        }
        ServiceQuery::Missing => {}
        ServiceQuery::Installed(_) => unreachable!(),
    }
    if legacy_process_running(session)? {
        return Err("检测到旧方式启动的 accServer.exe，请先点击“停止服务器”再更新程序".to_string());
    }
    Ok(server_path)
}

pub(crate) fn prepare_service_after_deploy(
    session: &Session,
    server_path: &str,
) -> Result<(), String> {
    let server_path = normalize_server_path(server_path)?;
    ensure_acc_server_exists(session, &server_path)?;
    match query_service(session)? {
        ServiceQuery::Missing => {
            install_service(session, &server_path)?;
        }
        ServiceQuery::Installed(ServiceState::Stopped) => {
            refresh_service(session, &server_path)?;
        }
        ServiceQuery::Installed(state) => {
            return Err(format!(
                "ACC Windows 服务当前处于 {} 状态，请先停止服务器再更新程序",
                state.label()
            ));
        }
    }
    Ok(())
}

pub(crate) fn start_acc_service(session: &Session, server_path: &str) -> Result<String, String> {
    let server_path = normalize_server_path(server_path)?;
    let mut state = match query_service(session)? {
        ServiceQuery::Missing => {
            if legacy_process_running(session)? {
                return Ok(
                    "ACC服务器已通过旧方式运行；停止后再次启动将自动迁移为 Windows 服务"
                        .to_string(),
                );
            }
            install_service(session, &server_path)?
        }
        ServiceQuery::Installed(state) => {
            verify_service_path(session, &server_path)?;
            state
        }
    };

    if state == ServiceState::Running {
        return Ok(format!("ACC服务器已在运行中（服务: {}）", ACC_SERVICE_NAME));
    }
    if legacy_process_running(session)? {
        return Err(
            "检测到不属于 Windows 服务的 accServer.exe，请先点击“停止服务器”再启动".to_string(),
        );
    }

    if state == ServiceState::StopPending {
        wait_for_state(session, ServiceState::Stopped, Duration::from_secs(25))?;
        state = ServiceState::Stopped;
    }
    match state {
        ServiceState::StartPending | ServiceState::ContinuePending => {}
        ServiceState::Paused | ServiceState::PausePending => {
            run_sc_action(session, "continue", &[1062])?;
        }
        ServiceState::Stopped => {
            run_sc_action(session, "start", &[1056])?;
        }
        ServiceState::Running => unreachable!(),
        ServiceState::StopPending => unreachable!(),
    }

    wait_for_state(session, ServiceState::Running, Duration::from_secs(15))?;
    Ok(format!(
        "ACC服务器启动成功（Windows 服务: {}）",
        ACC_SERVICE_NAME
    ))
}

pub(crate) fn stop_acc_service(session: &Session) -> Result<String, String> {
    match query_service(session)? {
        ServiceQuery::Missing => {
            if kill_legacy_process(session)? {
                return Ok("旧版 ACC 进程已停止；下次启动将自动安装 Windows 服务".to_string());
            }
            return Ok("ACC服务器已经停止".to_string());
        }
        ServiceQuery::Installed(ServiceState::Stopped) => {
            if kill_legacy_process(session)? {
                return Ok("ACC Windows 服务已停止，同时清理了旧版 ACC 进程".to_string());
            }
            return Ok("ACC服务器已经停止".to_string());
        }
        ServiceQuery::Installed(ServiceState::StopPending) => {}
        ServiceQuery::Installed(_) => run_sc_action(session, "stop", &[1062])?,
    }

    wait_for_state(session, ServiceState::Stopped, Duration::from_secs(25))?;
    let cleaned_legacy = kill_legacy_process(session)?;
    if cleaned_legacy {
        Ok("ACC Windows 服务已停止，同时清理了遗留 ACC 进程".to_string())
    } else {
        Ok(format!(
            "ACC服务器已停止（Windows 服务: {}）",
            ACC_SERVICE_NAME
        ))
    }
}

pub(crate) fn check_acc_service_running(session: &Session) -> Result<bool, String> {
    match query_service(session)? {
        ServiceQuery::Missing => legacy_process_running(session),
        ServiceQuery::Installed(state) if state.is_active() => Ok(true),
        ServiceQuery::Installed(ServiceState::Stopped) => legacy_process_running(session),
        ServiceQuery::Installed(_) => unreachable!(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_english_and_chinese_service_states() {
        assert_eq!(
            parse_sc_state("        STATE              : 4  RUNNING"),
            Some(ServiceState::Running)
        );
        assert_eq!(
            parse_sc_state("        状态               : 1  STOPPED"),
            Some(ServiceState::Stopped)
        );
        assert_eq!(
            parse_sc_state("        STATE              : 2  START_PENDING"),
            Some(ServiceState::StartPending)
        );
        assert_eq!(
            parse_sc_state("        状态               : 3  STOP_PENDING"),
            Some(ServiceState::StopPending)
        );
    }

    #[test]
    fn parses_sc_error_codes() {
        assert_eq!(
            parse_sc_error_code("[SC] OpenService FAILED 1060: service missing"),
            Some(1060)
        );
        assert_eq!(
            parse_sc_error_code("[SC] OpenService 失败 5: 拒绝访问"),
            Some(5)
        );
        assert_eq!(
            parse_sc_error_code("[SC] StartService FAILED 1056"),
            Some(1056)
        );
        assert_eq!(
            parse_sc_error_code("[SC] ControlService FAILED 1062"),
            Some(1062)
        );
        assert_eq!(
            sc_error_code(&CommandOutput {
                exit_code: 1060,
                stdout: "[SC] OpenService <localized text unavailable>".to_string(),
                stderr: String::new(),
            }),
            Some(1060)
        );
        assert_eq!(
            parse_sc_state("        <localized label unavailable> : 4  RUNNING"),
            Some(ServiceState::Running)
        );
    }

    #[test]
    fn creates_quoted_wrapper_command_for_paths_with_spaces() {
        assert_eq!(
            wrapper_action_command("C:\\ACC Servers\\League", "install"),
            r#"cmd.exe /D /S /C ""C:\ACC Servers\League\ACCServerService.exe" install""#
        );
        assert_eq!(
            file_exists_command("C:\\ACC Servers\\League\\accServer.exe"),
            r#"cmd.exe /D /C if exist "C:\ACC Servers\League\accServer.exe" (exit /B 0) else (exit /B 2)"#
        );
        assert_eq!(
            service_config_command(),
            r#"sc.exe config ACCPitWallServer start= demand obj= LocalSystem DisplayName= "ACC Pit Wall Server""#
        );
        assert_eq!(
            service_description_command(),
            r#"sc.exe description ACCPitWallServer "Assetto Corsa Competizione Dedicated Server managed by ACC Pit Wall""#
        );
    }

    #[test]
    fn service_xml_has_required_fixed_settings() {
        assert!(ACC_SERVICE_XML.contains("<id>ACCPitWallServer</id>"));
        assert!(ACC_SERVICE_XML.contains("<executable>%BASE%\\accServer.exe</executable>"));
        assert!(ACC_SERVICE_XML.contains("<workingdirectory>%BASE%</workingdirectory>"));
        assert!(ACC_SERVICE_XML.contains("<startmode>Manual</startmode>"));
        assert!(ACC_SERVICE_XML.contains("<user>LocalSystem</user>"));
        assert!(ACC_SERVICE_XML.contains("<stoptimeout>20sec</stoptimeout>"));
        assert!(!ACC_SERVICE_XML.contains("<onfailure"));
    }

    #[test]
    fn validates_server_paths_and_embedded_winsw() {
        assert_eq!(
            normalize_server_path("C:/ACC Servers/League/").unwrap(),
            "C:\\ACC Servers\\League"
        );
        assert!(normalize_server_path("ACC_Server").is_err());
        assert!(normalize_server_path("C:\\%TEMP%\\ACC").is_err());
        assert_eq!(format!("{:x}", Sha256::digest(WINSW_BYTES)), WINSW_SHA256);
    }
}
