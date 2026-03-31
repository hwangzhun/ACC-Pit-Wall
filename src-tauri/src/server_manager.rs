use std::fs;
use std::path::PathBuf;
use dirs;
use serde::{Deserialize, Serialize};
use serde_json;
use crate::ssh_utils::ServerProfile;

#[derive(Debug, Serialize, Deserialize)]
pub struct ServerListItem {
    pub name: String,
    pub host: String,
    pub port: u16,
    pub username: String,
    pub server_path: Option<String>,
    #[serde(default)]
    pub description: Option<String>,
    pub created_at: String,
}

/// 获取服务器存储目录
fn get_servers_dir() -> Result<PathBuf, String> {
    let app_data = dirs::config_dir()
        .ok_or_else(|| "无法获取应用数据目录".to_string())?;
    
    let servers_dir = app_data.join("acc-config-generator").join("servers");
    
    // 确保目录存在
    fs::create_dir_all(&servers_dir)
        .map_err(|e| format!("创建服务器目录失败: {}", e))?;
    
    Ok(servers_dir)
}

/// 获取所有服务器列表
pub fn get_servers() -> Result<Vec<ServerListItem>, String> {
    let servers_dir = get_servers_dir()?;
    let mut servers = Vec::new();
    
    let entries = fs::read_dir(&servers_dir)
        .map_err(|e| format!("读取服务器目录失败: {}", e))?;
    
    for entry in entries {
        let entry = entry.map_err(|e| format!("读取目录项失败: {}", e))?;
        let path = entry.path();
        
        if path.is_file() && path.extension().map_or(false, |ext| ext == "json") {
            let content = fs::read_to_string(&path)
                .map_err(|e| format!("读取服务器文件失败: {}", e))?;
            
            let server: ServerProfile = serde_json::from_str(&content)
                .map_err(|e| format!("解析服务器文件失败: {}", e))?;
            
            servers.push(ServerListItem {
                name: server.name,
                host: server.config.host,
                port: server.config.port,
                username: server.config.username,
                server_path: server.server_path,
                description: server.description,
                created_at: server.created_at,
            });
        }
    }
    
    Ok(servers)
}

/// 保存服务器配置
pub fn save_server(profile: ServerProfile) -> Result<(), String> {
    let servers_dir = get_servers_dir()?;
    
    // 清理文件名中的特殊字符
    let safe_name = profile.name.chars()
        .map(|c| if c.is_alphanumeric() || c == '-' || c == '_' {
            c
        } else {
            '_'
        })
        .collect::<String>();
    
    let filename = format!("{}.json", safe_name);
    let filepath = servers_dir.join(&filename);
    
    let content = serde_json::to_string_pretty(&profile)
        .map_err(|e| format!("序列化服务器配置失败: {}", e))?;
    
    fs::write(&filepath, content)
        .map_err(|e| format!("写入服务器文件失败: {}", e))?;
    
    Ok(())
}

/// 加载服务器配置
pub fn load_server(name: String) -> Result<ServerProfile, String> {
    let servers_dir = get_servers_dir()?;
    
    let safe_name = name.chars()
        .map(|c| if c.is_alphanumeric() || c == '-' || c == '_' {
            c
        } else {
            '_'
        })
        .collect::<String>();
    
    let filename = format!("{}.json", safe_name);
    let filepath = servers_dir.join(&filename);
    
    let content = fs::read_to_string(&filepath)
        .map_err(|e| format!("读取服务器文件失败: {}", e))?;
    
    let server: ServerProfile = serde_json::from_str(&content)
        .map_err(|e| format!("解析服务器文件失败: {}", e))?;
    
    Ok(server)
}

////// 删除服务器配置
pub fn delete_server(name: String) -> Result<(), String> {
    let servers_dir = get_servers_dir()?;
    
    let safe_name = name.chars()
        .map(|c| if c.is_alphanumeric() || c == '-' || c == '_' {
            c
        } else {
            '_'
        })
        .collect::<String>();
    
    let filename = format!("{}.json", safe_name);
    let filepath = servers_dir.join(&filename);
    
    fs::remove_file(&filepath)
        .map_err(|e| format!("删除服务器文件失败: {}", e))?;
    
    Ok(())
}

/// 重命名服务器配置
pub fn rename_server(old_name: String, new_name: String) -> Result<ServerProfile, String> {
    let servers_dir = get_servers_dir()?;
    
    let safe_old_name = old_name.chars()
        .map(|c| if c.is_alphanumeric() || c == '-' || c == '_' {
            c
        } else {
            '_'
        })
        .collect::<String>();
    
    let safe_new_name = new_name.chars()
        .map(|c| if c.is_alphanumeric() || c == '-' || c == '_' {
            c
        } else {
            '_'
        })
        .collect::<String>();
    
    let old_filepath = servers_dir.join(format!("{}.json", safe_old_name));
    let new_filepath = servers_dir.join(format!("{}.json", safe_new_name));
    
    if !old_filepath.exists() {
        return Err("服务器不存在".to_string());
    }
    
    if new_filepath.exists() && safe_old_name != safe_new_name {
        return Err("新名称已存在".to_string());
    }
    
    let content = fs::read_to_string(&old_filepath)
        .map_err(|e| format!("读取服务器文件失败: {}", e))?;
    
    let mut server: ServerProfile = serde_json::from_str(&content)
        .map_err(|e| format!("解析服务器文件失败: {}", e))?;
    
    server.name = new_name.clone();
    
    let new_content = serde_json::to_string_pretty(&server)
        .map_err(|e| format!("序列化服务器配置失败: {}", e))?;
    
    fs::write(&new_filepath, new_content)
        .map_err(|e| format!("写入新服务器文件失败: {}", e))?;
    
    if safe_old_name != safe_new_name {
        fs::remove_file(&old_filepath)
            .map_err(|e| format!("删除旧服务器文件失败: {}", e))?;
    }
    
    Ok(server)
}
