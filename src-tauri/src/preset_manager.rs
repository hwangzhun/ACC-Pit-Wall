use std::fs;
use std::path::PathBuf;
use dirs;
use serde::{Deserialize, Serialize};
use serde_json;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Preset {
    pub name: String,
    pub description: String,
    pub configs: serde_json::Value,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PresetListItem {
    pub name: String,
    pub description: String,
    pub created_at: String,
    pub updated_at: String,
    pub track: Option<String>,
    pub car_group: Option<String>,
}

/// 获取预设存储目录
fn get_presets_dir() -> Result<PathBuf, String> {
    let app_data = dirs::config_dir()
        .ok_or_else(|| "无法获取应用数据目录".to_string())?;
    
    let presets_dir = app_data.join("acc-config-generator").join("presets");
    
    // 确保目录存在
    fs::create_dir_all(&presets_dir)
        .map_err(|e| format!("创建预设目录失败: {}", e))?;
    
    Ok(presets_dir)
}

/// 获取所有预设列表
pub fn get_presets() -> Result<Vec<PresetListItem>, String> {
    let presets_dir = get_presets_dir()?;
    let mut presets = Vec::new();

    let entries = fs::read_dir(&presets_dir)
        .map_err(|e| format!("读取预设目录失败: {}", e))?;

    for entry in entries {
        let entry = entry.map_err(|e| format!("读取目录项失败: {}", e))?;
        let path = entry.path();

        if path.is_file() && path.extension().map_or(false, |ext| ext == "json") {
            let content = fs::read_to_string(&path)
                .map_err(|e| format!("读取预设文件失败: {}", e))?;

            let preset: Preset = serde_json::from_str(&content)
                .map_err(|e| format!("解析预设文件失败: {}", e))?;

            let metadata = fs::metadata(&path)
                .map_err(|e| format!("获取文件元数据失败: {}", e))?;

            let updated_at = metadata.modified()
                .ok()
                .and_then(|mtime| chrono::DateTime::<chrono::Utc>::try_from(mtime).ok())
                .map(|dt| dt.to_rfc3339())
                .unwrap_or_else(|| "unknown".to_string());

            // 从 configs 中提取 track 和 carGroup
            let track = preset.configs
                .get("event")
                .and_then(|v| v.get("track"))
                .and_then(|v| v.as_str())
                .map(|s| s.to_string());

            let car_group = preset.configs
                .get("settings")
                .and_then(|v| v.get("carGroup"))
                .and_then(|v| v.as_str())
                .map(|s| s.to_string());

            presets.push(PresetListItem {
                name: preset.name,
                description: preset.description,
                created_at: preset.created_at,
                updated_at,
                track,
                car_group,
            });
        }
    }

    Ok(presets)
}

/// 保存预设
pub fn save_preset(name: String, description: String, configs: serde_json::Value) -> Result<(), String> {
    let presets_dir = get_presets_dir()?;
    
    // 清理文件名中的特殊字符
    let safe_name = name.chars()
        .map(|c| if c.is_alphanumeric() || c == '-' || c == '_' {
            c
        } else {
            '_'
        })
        .collect::<String>();
    
    let filename = format!("{}.json", safe_name);
    let filepath = presets_dir.join(&filename);
    
    let preset = Preset {
        name: name.clone(),
        description,
        configs,
        created_at: chrono::Utc::now().to_rfc3339(),
    };
    
    let content = serde_json::to_string_pretty(&preset)
        .map_err(|e| format!("序列化预设失败: {}", e))?;
    
    fs::write(&filepath, content)
        .map_err(|e| format!("写入预设文件失败: {}", e))?;
    
    Ok(())
}

/// 加载预设
pub fn load_preset(name: String) -> Result<Preset, String> {
    let presets_dir = get_presets_dir()?;
    
    let safe_name = name.chars()
        .map(|c| if c.is_alphanumeric() || c == '-' || c == '_' {
            c
        } else {
            '_'
        })
        .collect::<String>();
    
    let filename = format!("{}.json", safe_name);
    let filepath = presets_dir.join(&filename);
    
    let content = fs::read_to_string(&filepath)
        .map_err(|e| format!("读取预设文件失败: {}", e))?;
    
    let preset: Preset = serde_json::from_str(&content)
        .map_err(|e| format!("解析预设文件失败: {}", e))?;
    
    Ok(preset)
}

/// 更新预设内容（覆盖 configs，保留创建时间；可选更新描述）
pub fn update_preset(
    name: String,
    configs: serde_json::Value,
    new_description: Option<String>,
) -> Result<(), String> {
    let presets_dir = get_presets_dir()?;

    let safe_name = name
        .chars()
        .map(|c| {
            if c.is_alphanumeric() || c == '-' || c == '_' {
                c
            } else {
                '_'
            }
        })
        .collect::<String>();

    let filename = format!("{}.json", safe_name);
    let filepath = presets_dir.join(&filename);

    let content = fs::read_to_string(&filepath)
        .map_err(|e| format!("读取预设文件失败: {}", e))?;

    let mut preset: Preset = serde_json::from_str(&content)
        .map_err(|e| format!("解析预设文件失败: {}", e))?;

    preset.configs = configs;
    if let Some(desc) = new_description {
        preset.description = desc;
    }

    let new_content = serde_json::to_string_pretty(&preset)
        .map_err(|e| format!("序列化预设失败: {}", e))?;

    fs::write(&filepath, new_content).map_err(|e| format!("写入预设文件失败: {}", e))?;

    Ok(())
}

/// 删除预设
pub fn delete_preset(name: String) -> Result<(), String> {
    let presets_dir = get_presets_dir()?;
    
    let safe_name = name.chars()
        .map(|c| if c.is_alphanumeric() || c == '-' || c == '_' {
            c
        } else {
            '_'
        })
        .collect::<String>();
    
    let filename = format!("{}.json", safe_name);
    let filepath = presets_dir.join(&filename);
    
    fs::remove_file(&filepath)
        .map_err(|e| format!("删除预设文件失败: {}", e))?;
    
    Ok(())
}

/// 重命名预设
pub fn rename_preset(old_name: String, new_name: String, new_description: Option<String>) -> Result<(), String> {
    let presets_dir = get_presets_dir()?;
    
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
    
    let old_filename = format!("{}.json", safe_old_name);
    let new_filename = format!("{}.json", safe_new_name);
    
    let old_filepath = presets_dir.join(&old_filename);
    let new_filepath = presets_dir.join(&new_filename);
    
    // 读取现有预设
    let content = fs::read_to_string(&old_filepath)
        .map_err(|e| format!("读取预设文件失败: {}", e))?;
    
    let mut preset: Preset = serde_json::from_str(&content)
        .map_err(|e| format!("解析预设文件失败: {}", e))?;
    
    // 更新名称和描述
    preset.name = new_name.clone();
    if let Some(desc) = new_description {
        preset.description = desc;
    }
    
    // 写入新文件
    let new_content = serde_json::to_string_pretty(&preset)
        .map_err(|e| format!("序列化预设失败: {}", e))?;
    
    fs::write(&new_filepath, new_content)
        .map_err(|e| format!("写入新预设文件失败: {}", e))?;
    
    // 删除旧文件（如果名称不同）
    if old_name != new_name {
        fs::remove_file(&old_filepath)
            .map_err(|e| format!("删除旧预设文件失败: {}", e))?;
    }
    
    Ok(())
}
