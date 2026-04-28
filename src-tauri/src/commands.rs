use crate::ssh_utils::{SshConfig, DeployOptions, test_ssh_connection, deploy_configs, ServerProfile, connect_ssh, disconnect_ssh, get_ssh_status, ConnectResult, delete_config_folder as delete_cfg_folder, download_results_filtered, download_server_cfg_configs};
use crate::preset_manager::{get_presets, save_preset, load_preset, update_preset, delete_preset, rename_preset};
use crate::server_manager::{get_servers, save_server, load_server, delete_server, rename_server};
use serde_json::Value;
use tauri::Manager;

#[tauri::command]
pub async fn connect(config: SshConfig) -> Result<ConnectResult, String> {
    Ok(connect_ssh(&config))
}

#[tauri::command]
pub async fn disconnect() -> Result<String, String> {
    disconnect_ssh()
}

#[tauri::command]
pub async fn get_connection_status() -> Result<crate::ssh_utils::ConnectionStatus, String> {
    Ok(get_ssh_status())
}

#[tauri::command]
pub async fn test_connection(config: SshConfig) -> Result<Value, String> {
    let result = test_ssh_connection(&config);
    Ok(serde_json::to_value(result).map_err(|e| e.to_string())?)
}

/// 部署配置到远程服务器
#[tauri::command]
pub async fn deploy(
    ssh_config: SshConfig,
    options: DeployOptions,
    configs: Value,
) -> Result<Value, String> {
    let result = deploy_configs(&ssh_config, &options, &configs);
    Ok(serde_json::to_value(result).map_err(|e| e.to_string())?)
}

/// 下载ACC服务器
#[tauri::command]
pub async fn download_acc_server_cmd(
    ssh_config: SshConfig,
    server_path: String,
    download_url: String,
) -> Result<String, String> {
    crate::ssh_utils::download_acc_server(&ssh_config, &server_path, &download_url)
}

/// 从本地上传ACC服务器
#[tauri::command]
pub async fn upload_acc_server_local_cmd(
    ssh_config: SshConfig,
    server_path: String,
    local_zip_path: String,
) -> Result<Value, String> {
    match crate::ssh_utils::upload_acc_server_from_local(&ssh_config, &server_path, &local_zip_path) {
        Ok(message) => Ok(serde_json::json!({
            "success": true,
            "message": message
        })),
        Err(error) => Ok(serde_json::json!({
            "success": false,
            "error": error
        }))
    }
}

/// 启动ACC服务器
#[tauri::command]
pub async fn start_acc_server_cmd(
    ssh_config: SshConfig,
    server_path: String,
) -> Result<Value, String> {
    let result = tokio::task::spawn_blocking(move || {
        crate::ssh_utils::start_acc_server(&ssh_config, &server_path)
    })
    .await
    .map_err(|e| format!("任务执行失败: {}", e))?;

    match result {
        Ok(message) => Ok(serde_json::json!({
            "success": true,
            "message": message
        })),
        Err(error) => Ok(serde_json::json!({
            "success": false,
            "error": error
        }))
    }
}

/// 检测ACC服务器是否正在运行
#[tauri::command]
pub async fn check_acc_server_status_cmd(
    ssh_config: SshConfig,
) -> Result<Value, String> {
    match crate::ssh_utils::check_acc_server_running(&ssh_config) {
        Ok(running) => Ok(serde_json::json!({
            "success": true,
            "running": running
        })),
        Err(error) => Ok(serde_json::json!({
            "success": false,
            "running": false,
            "error": error
        }))
    }
}

/// 停止ACC服务器
#[tauri::command]
pub async fn stop_acc_server_cmd(
    ssh_config: SshConfig,
) -> Result<Value, String> {
    match crate::ssh_utils::stop_acc_server(&ssh_config) {
        Ok(message) => Ok(serde_json::json!({
            "success": true,
            "message": message
        })),
        Err(error) => Ok(serde_json::json!({
            "success": false,
            "error": error
        }))
    }
}

/// 下载赛后报告
#[tauri::command]
pub async fn download_results_cmd(
    ssh_config: SshConfig,
    server_path: String,
    local_path: String,
) -> Result<String, String> {
    crate::ssh_utils::download_results(&ssh_config, &server_path, &local_path)
}

/// 获取预设列表
#[tauri::command]
pub async fn get_preset_list() -> Result<Value, String> {
    let presets = get_presets()?;
    Ok(serde_json::to_value(presets).map_err(|e| e.to_string())?)
}

/// 保存预设
#[tauri::command]
pub async fn save_preset_cmd(
    name: String,
    description: String,
    configs: Value,
) -> Result<String, String> {
    save_preset(name, description, configs)?;
    Ok("预设保存成功".to_string())
}

/// 加载预设
#[tauri::command]
pub async fn load_preset_cmd(name: String) -> Result<Value, String> {
    let preset = load_preset(name)?;
    Ok(serde_json::to_value(preset).map_err(|e| e.to_string())?)
}

/// 更新预设（覆盖 configs）
#[tauri::command]
pub async fn update_preset_cmd(
    name: String,
    configs: Value,
    new_description: Option<String>,
) -> Result<String, String> {
    update_preset(name, configs, new_description)?;
    Ok("预设已更新".to_string())
}

/// 删除预设
#[tauri::command]
pub async fn delete_preset_cmd(name: String) -> Result<String, String> {
    delete_preset(name)?;
    Ok("预设删除成功".to_string())
}

/// 重命名预设
#[tauri::command]
pub async fn rename_preset_cmd(
    old_name: String,
    new_name: String,
    new_description: Option<String>,
) -> Result<String, String> {
    rename_preset(old_name, new_name, new_description)?;
    Ok("预设重命名成功".to_string())
}

/// 获取应用数据目录
#[tauri::command]
pub async fn get_app_data_dir() -> Result<String, String> {
    let app_data = dirs::config_dir()
        .ok_or_else(|| "无法获取应用数据目录".to_string())?;
    Ok(app_data.to_string_lossy().to_string())
}

/// 获取可执行文件所在目录（软件根目录）
#[tauri::command]
pub async fn get_app_exe_dir() -> Result<String, String> {
    let exe_path = std::env::current_exe()
        .map_err(|e| format!("获取可执行文件路径失败: {}", e))?;
    let exe_dir = exe_path.parent()
        .ok_or_else(|| "无法获取可执行文件目录".to_string())?;
    Ok(exe_dir.to_string_lossy().to_string())
}

/// 获取应用资源目录（安装包内 resources）
#[tauri::command]
pub async fn get_app_resource_dir(app: tauri::AppHandle) -> Result<String, String> {
    let resource_dir = app
        .path()
        .resource_dir()
        .map_err(|e| format!("获取应用资源目录失败: {}", e))?;
    Ok(resource_dir.to_string_lossy().to_string())
}

/// 获取服务器列表
#[tauri::command]
pub async fn get_server_list() -> Result<Value, String> {
    let servers = get_servers()?;
    Ok(serde_json::to_value(servers).map_err(|e| e.to_string())?)
}

/// 保存服务器
#[tauri::command]
pub async fn save_server_cmd(profile: ServerProfile) -> Result<String, String> {
    save_server(profile)?;
    Ok("服务器保存成功".to_string())
}

/// 加载服务器
#[tauri::command]
pub async fn load_server_cmd(name: String) -> Result<Value, String> {
    let server = load_server(name)?;
    Ok(serde_json::to_value(server).map_err(|e| e.to_string())?)
}

/// 删除服务器
#[tauri::command]
pub async fn delete_server_cmd(name: String) -> Result<String, String> {
    delete_server(name)?;
    Ok("服务器删除成功".to_string())
}

/// 重命名服务器
#[tauri::command]
pub async fn rename_server_cmd(old_name: String, new_name: String) -> Result<Value, String> {
    let server = rename_server(old_name, new_name)?;
    Ok(serde_json::to_value(server).map_err(|e| e.to_string())?)
}

/// 删除配置文件夹
#[tauri::command]
pub async fn delete_config_folder(config: SshConfig, server_path: String) -> Result<Value, String> {
    match delete_cfg_folder(&config, &server_path) {
        Ok(result) => Ok(serde_json::to_value(result).map_err(|e| e.to_string())?),
        Err(error) => Ok(serde_json::json!({
            "success": false,
            "error": error
        }))
    }
}

/// 下载过滤后的比赛结果（只下载 _Q 和 _R 结尾的 JSON 文件）
#[tauri::command]
pub async fn download_results_filtered_cmd(
    ssh_config: SshConfig,
    server_path: String,
    local_path: String,
) -> Result<Value, String> {
    let result = download_results_filtered(&ssh_config, &server_path, &local_path)?;
    Ok(result)
}

/// 从服务器读取 cfg 配置
#[tauri::command]
pub async fn pull_server_config_cmd(
    ssh_config: SshConfig,
    server_path: String,
) -> Result<Value, String> {
    match download_server_cfg_configs(&ssh_config, &server_path) {
        Ok(result) => Ok(result),
        Err(error) => Ok(serde_json::json!({
            "success": false,
            "error": error
        })),
    }
}

// ============================================================================
// LFM BOP 缓存相关功能
// ============================================================================

use std::fs;
use std::path::PathBuf;
use chrono::{Utc, Timelike, Datelike, TimeZone};

const LFM_API_URL: &str = "https://api3.lowfuelmotorsport.com/api/hotlaps/getAccBop";
const CACHE_FILENAME: &str = "lfm_bop_cache.json";

/// LFM 缓存数据结构
#[derive(serde::Serialize, serde::Deserialize, Debug)]
struct LfmBopCache {
    /// 数据
    data: serde_json::Value,
    /// 最后成功获取时间（UTC 毫秒时间戳）
    last_fetched_at: i64,
    /// 数据来源时间戳（可选，来自 LFM API 响应）
    source_timestamp: Option<i64>,
}

/// 缓存状态响应
#[derive(serde::Serialize)]
struct LfmBopCacheStatus {
    exists: bool,
    is_valid: bool,
    last_fetched_at: Option<i64>,
    next_update_at: Option<i64>,
    message: String,
}

/// 获取缓存文件路径
fn get_cache_file_path() -> Result<PathBuf, String> {
    let app_data = dirs::config_dir()
        .ok_or_else(|| "无法获取应用数据目录".to_string())?;
    let cache_dir = app_data.join("acc-config-generator").join("cache");
    fs::create_dir_all(&cache_dir)
        .map_err(|e| format!("创建缓存目录失败: {}", e))?;
    Ok(cache_dir.join(CACHE_FILENAME))
}

/// 判断是否需要按周更新
/// 规则：每周一 CE(S)T 00:30 后检查更新
/// 使用 UTC 计算：CE(S)T 00:30 = UTC 周日 22:30（冬令时）/ 周日 23:30（夏令时）
/// 简化：使用 UTC 周日 22:30 到周一 00:30 作为更新窗口
fn should_refresh_weekly(last_fetched_at: i64, now_utc: i64) -> bool {
    // 如果从未缓存或缓存时间无效，需要刷新
    if last_fetched_at <= 0 {
        return true;
    }
    
    // 计算本周一的更新时间点（UTC）
    // CE(S)T 00:30 周一 ≈ UTC 周日 22:30-23:30
    // 简化方案：使用 UTC 周日 23:00 作为更新触发点
    let now_utc_dt = if now_utc > 0 {
        Utc.timestamp_millis_opt(now_utc).unwrap()
    } else {
        Utc::now()
    };
    
    // 找到本周的周日（星期一前 6 天）
    let days_from_monday = now_utc_dt.weekday().num_days_from_monday() as i64;
    let days_to_sunday = (6 - days_from_monday % 7) as i64;
    let this_sunday = (now_utc_dt - chrono::Duration::days(days_to_sunday))
        .with_hour(23)
        .and_then(|d: chrono::DateTime<Utc>| d.with_minute(0))
        .and_then(|d: chrono::DateTime<Utc>| d.with_second(0))
        .and_then(|d: chrono::DateTime<Utc>| d.with_nanosecond(0));
    
    if let Some(sunday_23_utc) = this_sunday {
        let update_time: i64 = sunday_23_utc.timestamp_millis();
        
        // 如果当前时间已过本周更新点，且缓存时间早于更新点，则需要刷新
        if now_utc >= update_time && last_fetched_at < update_time {
            return true;
        }
    }
    
    false
}

/// 读取缓存文件
fn read_cache() -> Result<LfmBopCache, String> {
    let cache_path = get_cache_file_path()?;
    let content = fs::read_to_string(&cache_path)
        .map_err(|e| format!("读取缓存文件失败: {}", e))?;
    let cache: LfmBopCache = serde_json::from_str(&content)
        .map_err(|e| format!("解析缓存文件失败: {}", e))?;
    Ok(cache)
}

/// 写入缓存文件
fn write_cache(data: serde_json::Value, source_timestamp: Option<i64>) -> Result<(), String> {
    let cache_path = get_cache_file_path()?;
    let cache = LfmBopCache {
        data,
        last_fetched_at: Utc::now().timestamp_millis(),
        source_timestamp,
    };
    let json = serde_json::to_string_pretty(&cache)
        .map_err(|e| format!("序列化缓存失败: {}", e))?;
    fs::write(&cache_path, json)
        .map_err(|e| format!("写入缓存文件失败: {}", e))?;
    Ok(())
}

/// 从 LFM API 获取数据
async fn fetch_from_lfm_api() -> Result<serde_json::Value, String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .build()
        .map_err(|e| format!("创建 HTTP 客户端失败: {}", e))?;
    
    let response = client
        .get(LFM_API_URL)
        .header("Accept", "application/json")
        .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        .send()
        .await
        .map_err(|e| format!("请求 LFM API 失败: {}", e))?;
    
    if !response.status().is_success() {
        return Err(format!("LFM API 返回错误状态: {}", response.status()));
    }
    
    let text = response.text().await
        .map_err(|e| format!("读取响应内容失败: {}", e))?;
    
    let json: serde_json::Value = serde_json::from_str(&text)
        .map_err(|e| format!("解析 JSON 响应失败: {}", e))?;
    
    Ok(json)
}

/// 获取 LFM BOP 缓存数据（带周更检查）
#[tauri::command]
pub async fn get_lfm_bop_cached(force_refresh: bool) -> Result<Value, String> {
    let now_utc = Utc::now().timestamp_millis();
    
    // 尝试读取缓存
    let cache_result = read_cache();
    
    match cache_result {
        Ok(cache) => {
            // 检查是否需要刷新
            let need_refresh = force_refresh || should_refresh_weekly(cache.last_fetched_at, now_utc);
            
            if !need_refresh {
                // 返回缓存数据
                return Ok(serde_json::json!({
                    "success": true,
                    "data": cache.data,
                    "from_cache": true,
                    "last_fetched_at": cache.last_fetched_at,
                    "source_timestamp": cache.source_timestamp,
                    "message": "使用缓存数据"
                }));
            }
            
            // 需要刷新，尝试从 API 获取
            match fetch_from_lfm_api().await {
                Ok(new_data) => {
                    // 写入新缓存
                    let source_ts = new_data
                        .get("timestamp")
                        .and_then(|v| v.as_i64())
                        .map(|v| if v < 1000000000000 { v * 1000 } else { v });
                    
                    if let Err(e) = write_cache(new_data.clone(), source_ts) {
                        return Ok(serde_json::json!({
                            "success": true,
                            "data": cache.data,
                            "from_cache": true,
                            "from_api": true,
                            "cache_write_failed": true,
                            "cache_error": e,
                            "last_fetched_at": cache.last_fetched_at,
                            "source_timestamp": source_ts,
                            "message": "成功获取新数据，但缓存写入失败，使用新数据"
                        }));
                    }
                    
                    return Ok(serde_json::json!({
                        "success": true,
                        "data": new_data,
                        "from_cache": false,
                        "from_api": true,
                        "last_fetched_at": Utc::now().timestamp_millis(),
                        "source_timestamp": source_ts,
                        "message": "成功更新缓存"
                    }));
                }
                Err(e) => {
                    // API 请求失败，回退到旧缓存
                    return Ok(serde_json::json!({
                        "success": true,
                        "data": cache.data,
                        "from_cache": true,
                        "from_api": false,
                        "api_error": e,
                        "last_fetched_at": cache.last_fetched_at,
                        "source_timestamp": cache.source_timestamp,
                        "message": format!("API 请求失败，使用缓存: {}", e)
                    }));
                }
            }
        }
        Err(_) => {
            // 无缓存，强制从 API 获取
            if force_refresh {
                match fetch_from_lfm_api().await {
                    Ok(new_data) => {
                        let source_ts = new_data
                            .get("timestamp")
                            .and_then(|v| v.as_i64())
                            .map(|v| if v < 1000000000000 { v * 1000 } else { v });
                        
                        if let Err(e) = write_cache(new_data.clone(), source_ts) {
                            return Ok(serde_json::json!({
                                "success": true,
                                "data": new_data,
                                "from_cache": false,
                                "from_api": true,
                                "cache_write_failed": true,
                                "cache_error": e,
                                "source_timestamp": source_ts,
                                "message": "成功获取新数据，但缓存写入失败"
                            }));
                        }
                        
                        return Ok(serde_json::json!({
                            "success": true,
                            "data": new_data,
                            "from_cache": false,
                            "from_api": true,
                            "last_fetched_at": Utc::now().timestamp_millis(),
                            "source_timestamp": source_ts,
                            "message": "成功获取并缓存数据"
                        }));
                    }
                    Err(e) => {
                        return Ok(serde_json::json!({
                            "success": false,
                            "data": serde_json::Value::Null,
                            "from_cache": false,
                            "from_api": false,
                            "error": e,
                            "message": "无法获取 LFM BOP 数据"
                        }));
                    }
                }
            } else {
                return Ok(serde_json::json!({
                    "success": false,
                    "data": serde_json::Value::Null,
                    "from_cache": false,
                    "from_api": false,
                    "error": "无缓存数据",
                    "message": "无本地缓存数据"
                }));
            }
        }
    }
}

/// 获取 LFM BOP 缓存状态
#[tauri::command]
pub async fn get_lfm_bop_cache_status() -> Result<Value, String> {
    let now_utc = Utc::now().timestamp_millis();
    
    match read_cache() {
        Ok(cache) => {
            let need_refresh = should_refresh_weekly(cache.last_fetched_at, now_utc);
            
            Ok(serde_json::to_value(LfmBopCacheStatus {
                exists: true,
                is_valid: !need_refresh,
                last_fetched_at: Some(cache.last_fetched_at),
                next_update_at: None,
                message: if need_refresh {
                    "缓存需要更新".to_string()
                } else {
                    "缓存有效".to_string()
                },
            }).map_err(|e| e.to_string())?)
        }
        Err(_) => {
            Ok(serde_json::to_value(LfmBopCacheStatus {
                exists: false,
                is_valid: false,
                last_fetched_at: None,
                next_update_at: None,
                message: "无缓存数据".to_string(),
            }).map_err(|e| e.to_string())?)
        }
    }
}

///() 清除 LFM BOP 缓存
#[tauri::command]
pub async fn clear_lfm_bop_cache() -> Result<Value, String> {
    let cache_path = get_cache_file_path()?;
    
    if cache_path.exists() {
        fs::remove_file(&cache_path)
            .map_err(|e| format!("删除缓存文件失败: {}", e))?;
        
        Ok(serde_json::json!({
            "success": true,
            "message": "缓存已清除"
        }))
    } else {
        Ok(serde_json::json!({
            "success": true,
            "message": "缓存文件不存在"
        }))
    }
}
