import { invoke } from '@tauri-apps/api/core'
import type { AllConfigs } from '../types/configuration'

export interface Preset {
  name: string
  description: string
  createdAt: string
  updatedAt: string
  track?: string
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

function requirePresetName(name: string): string {
  const normalized = name.trim()
  if (!normalized) throw new Error('Preset name cannot be empty')
  return normalized
}

export async function getPresets(): Promise<Preset[]> {
  const result = await invoke<Record<string, unknown>[]>('get_preset_list')
  return result.map(item => toCamelCase(item) as unknown as Preset)
}

export async function savePreset(name: string, description: string, configs: AllConfigs): Promise<void> {
  await invoke('save_preset_cmd', { name: requirePresetName(name), description: description.trim(), configs })
}

export async function updatePreset(name: string, configs: AllConfigs, description?: string): Promise<void> {
  await invoke('update_preset_cmd', {
    name: requirePresetName(name),
    configs,
    new_description: description?.trim()
  })
}

export async function loadPreset(name: string): Promise<PresetWithData> {
  const result = await invoke<Record<string, unknown>>('load_preset_cmd', { name: requirePresetName(name) })
  const camelCaseResult = toCamelCase(result) as unknown as Record<string, unknown>
  return {
    ...camelCaseResult,
    name: camelCaseResult.name as string,
    description: (camelCaseResult.description as string) ?? '',
    configs: camelCaseResult.configs as AllConfigs,
    createdAt: camelCaseResult.createdAt as string,
    updatedAt: camelCaseResult.updatedAt as string
  }
}

export async function renamePreset(oldName: string, newName: string, description?: string): Promise<void> {
  await invoke('rename_preset_cmd', {
    oldName: requirePresetName(oldName),
    newName: requirePresetName(newName),
    newDescription: description?.trim()
  })
}

export async function deletePreset(name: string): Promise<void> {
  await invoke('delete_preset_cmd', { name: requirePresetName(name) })
}
