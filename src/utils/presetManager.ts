import { invoke } from '@tauri-apps/api/core'
import type { AllConfigs } from '../types/configuration'

export interface Preset {
  name: string
  description: string
  createdAt: string
  updatedAt: string
  /** 来自 configs.event.track */
  track?: string
  /** 来自 configs.settings.carGroup */
  carGroup?: string
}

export interface PresetWithData extends Preset {
  configs: AllConfigs
}

function toCamelCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const key in obj) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
    const value = obj[key]
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[camelKey] = toCamelCase(value as Record<string, unknown>)
    } else {
      result[camelKey] = value
    }
  }
  return result
}

// 获取预设列表
export async function getPresets(): Promise<Preset[]> {
  const result = await invoke<Record<string, unknown>[]>('get_preset_list')
  return result.map((item) => toCamelCase(item) as unknown as Preset)
}

// 保存预设
export async function savePreset(name: string, description: string, configs: AllConfigs): Promise<void> {
  await invoke('save_preset_cmd', { name, description, configs })
}

/** 覆盖已有预设的 configs（不修改描述时传 undefined） */
export async function updatePreset(
  name: string,
  configs: AllConfigs,
  description?: string
): Promise<void> {
  await invoke('update_preset_cmd', {
    name,
    configs,
    new_description: description
  })
}

// 加载预设
export async function loadPreset(name: string): Promise<PresetWithData> {
  const result = await invoke<Record<string, unknown>>('load_preset_cmd', { name })
  const camelCaseResult = toCamelCase(result) as unknown as Record<string, unknown>
  
  const preset: PresetWithData = {
    ...camelCaseResult,
    name: camelCaseResult.name as string,
    description: (camelCaseResult.description as string) ?? '',
    configs: camelCaseResult.configs as AllConfigs,
    createdAt: camelCaseResult.createdAt as string,
    updatedAt: camelCaseResult.updatedAt as string
  }
  
  return preset
}

// 重命名预设
export async function renamePreset(oldName: string, newName: string, description?: string): Promise<void> {
  await invoke('rename_preset_cmd', {
    old_name: oldName,
    new_name: newName,
    new_description: description
  })
}

// 删除预设
export async function deletePreset(name: string): Promise<void> {
  await invoke('delete_preset_cmd', { name })
}
