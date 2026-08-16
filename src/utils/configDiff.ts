import type { AllConfigs, Session } from '../types/configuration'

export type ConfigSectionKey = keyof AllConfigs

export interface ConfigChange {
  section: ConfigSectionKey
  path: string
  before?: unknown
  after?: unknown
  sensitive: boolean
}

export interface ConfigDiffSection {
  key: ConfigSectionKey
  count: number
}

export interface ConfigDiffHighlight {
  key:
    | 'track'
    | 'carGroup'
    | 'maxCarSlots'
    | 'sessions'
    | 'ambientTemp'
    | 'cloudLevel'
    | 'rain'
    | 'weatherRandomness'
    | 'mandatoryPitstopCount'
    | 'entryCount'
    | 'bopCount'
    | 'passwords'
  before?: string | number
  after?: string | number
  sensitive?: boolean
}

export interface ConfigDiff {
  total: number
  sections: ConfigDiffSection[]
  highlights: ConfigDiffHighlight[]
  changes: ConfigChange[]
}

export interface PresetConfigSummary {
  track: string
  carGroup: string
  sessions: string
  ambientTemp: number
  cloudLevel: number
  rain: number
  weatherRandomness: number
  maxCarSlots: number
  entryCount: number
  mandatoryPitstopCount: number
  tyreSetCount: number
  bopCount: number
  restrictedAssistCount: number
}

const SECTION_KEYS: ConfigSectionKey[] = [
  'configuration',
  'settings',
  'event',
  'eventRules',
  'assistRules',
  'entryList',
  'bop'
]

const SENSITIVE_PATH_PATTERN = /(^|\.)(adminPassword|spectatorPassword|password)$/i

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function normalizeStable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalizeStable)
  if (!isPlainObject(value)) return value

  return Object.keys(value)
    .sort()
    .reduce<Record<string, unknown>>((result, key) => {
      result[key] = normalizeStable(value[key])
      return result
    }, {})
}

export function stableStringify(value: unknown): string {
  return JSON.stringify(normalizeStable(value))
}

export function configsEqual(left: AllConfigs, right: AllConfigs): boolean {
  return stableStringify(left) === stableStringify(right)
}

function collectChanges(
  before: unknown,
  after: unknown,
  section: ConfigSectionKey,
  path: string,
  result: ConfigChange[]
) {
  if (stableStringify(before) === stableStringify(after)) return

  if (Array.isArray(before) && Array.isArray(after)) {
    const length = Math.max(before.length, after.length)
    for (let index = 0; index < length; index += 1) {
      collectChanges(before[index], after[index], section, `${path}.${index}`, result)
    }
    return
  }

  if (isPlainObject(before) && isPlainObject(after)) {
    const keys = new Set([...Object.keys(before), ...Object.keys(after)])
    for (const key of [...keys].sort()) {
      collectChanges(before[key], after[key], section, `${path}.${key}`, result)
    }
    return
  }

  const sensitive = SENSITIVE_PATH_PATTERN.test(path)
  result.push({
    section,
    path,
    before: sensitive ? undefined : before,
    after: sensitive ? undefined : after,
    sensitive
  })
}

export function formatSessions(sessions: Session[]): string {
  const counters: Record<Session['sessionType'], number> = { P: 0, Q: 0, R: 0 }
  return sessions
    .map(session => {
      counters[session.sessionType] += 1
      const sameTypeCount = sessions.filter(item => item.sessionType === session.sessionType).length
      const suffix = sameTypeCount > 1 ? counters[session.sessionType] : ''
      return `${session.sessionType}${suffix} ${session.sessionDurationMinutes}m`
    })
    .join(' · ')
}

function addHighlight(
  highlights: ConfigDiffHighlight[],
  key: ConfigDiffHighlight['key'],
  before: string | number,
  after: string | number
) {
  if (before !== after) highlights.push({ key, before, after })
}

export function buildConfigDiff(before: AllConfigs, after: AllConfigs): ConfigDiff {
  const changes: ConfigChange[] = []
  for (const section of SECTION_KEYS) {
    collectChanges(before[section], after[section], section, section, changes)
  }

  const sections = SECTION_KEYS
    .map(key => ({ key, count: changes.filter(change => change.section === key).length }))
    .filter(section => section.count > 0)

  const highlights: ConfigDiffHighlight[] = []
  addHighlight(highlights, 'track', before.event.track, after.event.track)
  addHighlight(highlights, 'carGroup', before.settings.carGroup, after.settings.carGroup)
  addHighlight(highlights, 'maxCarSlots', before.settings.maxCarSlots, after.settings.maxCarSlots)
  addHighlight(highlights, 'sessions', formatSessions(before.event.sessions), formatSessions(after.event.sessions))
  addHighlight(highlights, 'ambientTemp', before.event.ambientTemp, after.event.ambientTemp)
  addHighlight(highlights, 'cloudLevel', before.event.cloudLevel, after.event.cloudLevel)
  addHighlight(highlights, 'rain', before.event.rain, after.event.rain)
  addHighlight(highlights, 'weatherRandomness', before.event.weatherRandomness, after.event.weatherRandomness)
  addHighlight(
    highlights,
    'mandatoryPitstopCount',
    before.eventRules.mandatoryPitstopCount,
    after.eventRules.mandatoryPitstopCount
  )
  addHighlight(highlights, 'entryCount', before.entryList.entries.length, after.entryList.entries.length)
  addHighlight(highlights, 'bopCount', before.bop.entries.length, after.bop.entries.length)

  if (changes.some(change => change.sensitive)) {
    highlights.push({ key: 'passwords', sensitive: true })
  }

  return { total: changes.length, sections, highlights, changes }
}

export function summarizeConfig(configs: AllConfigs): PresetConfigSummary {
  const assistValues = Object.values(configs.assistRules)
  return {
    track: configs.event.track,
    carGroup: configs.settings.carGroup,
    sessions: formatSessions(configs.event.sessions),
    ambientTemp: configs.event.ambientTemp,
    cloudLevel: configs.event.cloudLevel,
    rain: configs.event.rain,
    weatherRandomness: configs.event.weatherRandomness,
    maxCarSlots: configs.settings.maxCarSlots,
    entryCount: configs.entryList.entries.length,
    mandatoryPitstopCount: configs.eventRules.mandatoryPitstopCount,
    tyreSetCount: configs.eventRules.tyreSetCount,
    bopCount: configs.bop.entries.length,
    restrictedAssistCount: assistValues.filter(value => Number(value) > 0).length
  }
}

export function cloneConfigs(configs: AllConfigs): AllConfigs {
  return JSON.parse(JSON.stringify(configs)) as AllConfigs
}
