use std::fs;
use std::path::{Path, PathBuf};
use serde::{Deserialize, Serialize};

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

fn get_presets_dir() -> Result<PathBuf, String> {
    let app_data = dirs::config_dir()
        .ok_or_else(|| "无法获取应用数据目录".to_string())?;
    let presets_dir = app_data.join("acc-config-generator").join("presets");
    fs::create_dir_all(&presets_dir)
        .map_err(|error| format!("创建预设目录失败: {}", error))?;
    Ok(presets_dir)
}

fn normalize_name(name: String) -> Result<String, String> {
    let normalized = name.trim().to_string();
    if normalized.is_empty() {
        return Err("预设名称不能为空".to_string());
    }
    Ok(normalized)
}

fn safe_name(name: &str) -> String {
    name.chars()
        .map(|character| {
            if character.is_alphanumeric() || character == '-' || character == '_' {
                character
            } else {
                '_'
            }
        })
        .collect()
}

fn preset_path(directory: &Path, name: &str) -> PathBuf {
    directory.join(format!("{}.json", safe_name(name)))
}

fn read_named_preset(path: &Path, requested_name: &str) -> Result<Preset, String> {
    let content = fs::read_to_string(path)
        .map_err(|error| format!("读取预设文件失败: {}", error))?;
    let preset: Preset = serde_json::from_str(&content)
        .map_err(|error| format!("解析预设文件失败: {}", error))?;

    if preset.name.trim() != requested_name {
        return Err(format!(
            "预设名称冲突：请求“{}”，但对应文件属于“{}”",
            requested_name, preset.name
        ));
    }
    Ok(preset)
}

fn write_preset(path: &Path, preset: &Preset) -> Result<(), String> {
    let content = serde_json::to_string_pretty(preset)
        .map_err(|error| format!("序列化预设失败: {}", error))?;
    fs::write(path, content)
        .map_err(|error| format!("写入预设文件失败: {}", error))
}

pub fn get_presets() -> Result<Vec<PresetListItem>, String> {
    let presets_dir = get_presets_dir()?;
    let mut presets = Vec::new();

    for entry in fs::read_dir(&presets_dir)
        .map_err(|error| format!("读取预设目录失败: {}", error))?
    {
        let entry = entry.map_err(|error| format!("读取目录项失败: {}", error))?;
        let path = entry.path();
        if !path.is_file() || !path.extension().map_or(false, |extension| extension == "json") {
            continue;
        }

        let content = fs::read_to_string(&path)
            .map_err(|error| format!("读取预设文件失败: {}", error))?;
        let preset: Preset = serde_json::from_str(&content)
            .map_err(|error| format!("解析预设文件失败: {}", error))?;
        let metadata = fs::metadata(&path)
            .map_err(|error| format!("获取文件元数据失败: {}", error))?;
        let updated_at = metadata.modified()
            .ok()
            .and_then(|modified| chrono::DateTime::<chrono::Utc>::try_from(modified).ok())
            .map(|date| date.to_rfc3339())
            .unwrap_or_else(|| "unknown".to_string());
        let track = preset.configs.get("event")
            .and_then(|value| value.get("track"))
            .and_then(|value| value.as_str())
            .map(str::to_string);
        let car_group = preset.configs.get("settings")
            .and_then(|value| value.get("carGroup"))
            .and_then(|value| value.as_str())
            .map(str::to_string);

        presets.push(PresetListItem {
            name: preset.name,
            description: preset.description,
            created_at: preset.created_at,
            updated_at,
            track,
            car_group,
        });
    }

    Ok(presets)
}

pub fn save_preset(name: String, description: String, configs: serde_json::Value) -> Result<(), String> {
    let name = normalize_name(name)?;
    let presets_dir = get_presets_dir()?;
    let filepath = preset_path(&presets_dir, &name);

    if filepath.exists() {
        let owner = fs::read_to_string(&filepath)
            .ok()
            .and_then(|content| serde_json::from_str::<Preset>(&content).ok())
            .map(|preset| preset.name)
            .unwrap_or_else(|| name.clone());
        return Err(format!("预设已存在或名称与“{}”发生文件名冲突", owner));
    }

    write_preset(&filepath, &Preset {
        name,
        description: description.trim().to_string(),
        configs,
        created_at: chrono::Utc::now().to_rfc3339(),
    })
}

pub fn load_preset(name: String) -> Result<Preset, String> {
    let name = normalize_name(name)?;
    let presets_dir = get_presets_dir()?;
    read_named_preset(&preset_path(&presets_dir, &name), &name)
}

pub fn update_preset(
    name: String,
    configs: serde_json::Value,
    new_description: Option<String>,
) -> Result<(), String> {
    let name = normalize_name(name)?;
    let presets_dir = get_presets_dir()?;
    let filepath = preset_path(&presets_dir, &name);
    let mut preset = read_named_preset(&filepath, &name)?;
    preset.configs = configs;
    if let Some(description) = new_description {
        preset.description = description.trim().to_string();
    }
    write_preset(&filepath, &preset)
}

pub fn delete_preset(name: String) -> Result<(), String> {
    let name = normalize_name(name)?;
    let presets_dir = get_presets_dir()?;
    let filepath = preset_path(&presets_dir, &name);
    read_named_preset(&filepath, &name)?;
    fs::remove_file(&filepath)
        .map_err(|error| format!("删除预设文件失败: {}", error))
}

pub fn rename_preset(old_name: String, new_name: String, new_description: Option<String>) -> Result<(), String> {
    let old_name = normalize_name(old_name)?;
    let new_name = normalize_name(new_name)?;
    let presets_dir = get_presets_dir()?;
    let old_filepath = preset_path(&presets_dir, &old_name);
    let new_filepath = preset_path(&presets_dir, &new_name);
    let mut preset = read_named_preset(&old_filepath, &old_name)?;

    if old_filepath != new_filepath && new_filepath.exists() {
        let owner = fs::read_to_string(&new_filepath)
            .ok()
            .and_then(|content| serde_json::from_str::<Preset>(&content).ok())
            .map(|existing| existing.name)
            .unwrap_or_else(|| new_name.clone());
        return Err(format!("目标预设已存在或名称与“{}”发生文件名冲突", owner));
    }

    preset.name = new_name;
    if let Some(description) = new_description {
        preset.description = description.trim().to_string();
    }
    write_preset(&new_filepath, &preset)?;

    if old_filepath != new_filepath {
        fs::remove_file(&old_filepath)
            .map_err(|error| format!("删除旧预设文件失败: {}", error))?;
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::{normalize_name, safe_name};

    #[test]
    fn trims_and_rejects_empty_names() {
        assert_eq!(normalize_name("  Race  ".to_string()).unwrap(), "Race");
        assert!(normalize_name("   ".to_string()).is_err());
    }

    #[test]
    fn exposes_sanitized_name_collisions() {
        assert_eq!(safe_name("Race One"), "Race_One");
        assert_eq!(safe_name("Race@One"), "Race_One");
        assert_ne!(safe_name("Race-One"), safe_name("Race One"));
    }
}
