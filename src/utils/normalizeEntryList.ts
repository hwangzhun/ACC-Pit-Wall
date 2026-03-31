import type { EntryList } from '../types/configuration'

/** 兼容旧版 entrylist.json：补全 forceEntryList、entries */
export function normalizeEntryList(raw: Partial<EntryList>): EntryList {
  return {
    entries: Array.isArray(raw.entries) ? raw.entries : [],
    forceEntryList: raw.forceEntryList ?? 0,
  }
}
