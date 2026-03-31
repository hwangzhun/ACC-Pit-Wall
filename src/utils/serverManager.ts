import { invoke } from '@tauri-apps/api/core'
import type { ServerListItem, ServerProfile, SshConfig } from '../types/server'

function toSnakeCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const key in obj) {
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase()
    const value = obj[key]
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[snakeKey] = toSnakeCase(value as Record<string, unknown>)
    } else {
      result[snakeKey] = value
    }
  }
  return result
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

export async function getServers(): Promise<ServerListItem[]> {
  const result = await invoke<Record<string, unknown>[]>('get_server_list')
  return result.map((item) => toCamelCase(item) as unknown as ServerListItem)
}

export async function saveServer(profile: ServerProfile): Promise<void> {
  const snakeProfile = toSnakeCase(profile as unknown as Record<string, unknown>)
  await invoke('save_server_cmd', { profile: snakeProfile })
}

export async function loadServer(name: string): Promise<ServerProfile> {
  const result = await invoke<Record<string, unknown>>('load_server_cmd', { name })
  return toCamelCase(result) as unknown as ServerProfile
}

export async function deleteServer(name: string): Promise<void> {
  await invoke('delete_server_cmd', { name })
}

export async function renameServer(oldName: string, newName: string): Promise<ServerProfile> {
  const result = await invoke<Record<string, unknown>>('rename_server_cmd', {
    old_name: oldName,
    new_name: newName
  })
  return toCamelCase(result) as unknown as ServerProfile
}

export function createServerProfile(
  name: string,
  config: SshConfig,
  serverPath?: string,
  description?: string
): ServerProfile {
  return {
    name,
    config,
    serverPath,
    description,
    createdAt: new Date().toISOString()
  }
}