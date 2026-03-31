import type { AllConfigs, EntryList } from '../types/configuration'
import { normalizeEntryList } from './normalizeEntryList'

export const CONFIG_FILE_NAMES = [
  'configuration.json',
  'settings.json',
  'event.json',
  'eventRules.json',
  'assistRules.json',
  'entrylist.json',
  'bop.json'
] as const

/**
 * 下载单个配置文件
 */
export async function downloadSingleConfig(
  filename: string,
  content: unknown
): Promise<void> {
  const blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * 验证配置文件格式
 */
export function validateConfig(content: unknown): boolean {
  try {
    if (typeof content !== 'object' || content === null) {
      return false
    }

    JSON.stringify(content)
    return true
  } catch {
    return false
  }
}

/**
 * 从公共配置文件夹加载所有配置
 */
export async function loadConfigsFromPublic(): Promise<AllConfigs | null> {
  try {
    const [
      configuration,
      settings,
      event,
      eventRules,
      assistRules,
      entryList,
      bop
    ] = await Promise.all([
      fetch('/cfg/configuration.json').then(r => r.json()),
      fetch('/cfg/settings.json').then(r => r.json()),
      fetch('/cfg/event.json').then(r => r.json()),
      fetch('/cfg/eventRules.json').then(r => r.json()),
      fetch('/cfg/assistRules.json').then(r => r.json()),
      fetch('/cfg/entrylist.json').then(r => r.json()),
      fetch('/cfg/bop.json').then(r => r.json())
    ])

    return {
      configuration,
      settings,
      event,
      eventRules,
      assistRules,
      entryList: normalizeEntryList(entryList as Partial<EntryList>),
      bop,
    }
  } catch (error) {
    console.error('加载配置文件失败:', error)
    return null
  }
}
