import { describe, expect, it } from 'vitest'
import type { AllConfigs } from '../types/configuration'
import {
  defaultAssistRules, defaultBop, defaultConfiguration, defaultEntryList,
  defaultEvent, defaultEventRules, defaultSettings
} from '../types/defaults'
import { buildConfigDiff, cloneConfigs, configsEqual, stableStringify, summarizeConfig } from './configDiff'

function makeConfigs(): AllConfigs {
  return {
    configuration: defaultConfiguration(), settings: defaultSettings(), event: defaultEvent(),
    eventRules: defaultEventRules(), assistRules: defaultAssistRules(),
    entryList: defaultEntryList(), bop: defaultBop()
  }
}

describe('stable config comparison', () => {
  it('ignores object key order', () => {
    expect(stableStringify({ b: 2, a: 1 })).toBe(stableStringify({ a: 1, b: 2 }))
  })

  it('detects edits and array order changes', () => {
    const before = makeConfigs()
    before.event.sessions = [
      { dayOfWeekend: 1, hourOfDay: 10, sessionDurationMinutes: 20, sessionType: 'P', timeMultiplier: 1 },
      { dayOfWeekend: 2, hourOfDay: 14, sessionDurationMinutes: 45, sessionType: 'R', timeMultiplier: 1 }
    ]
    const after = cloneConfigs(before)
    expect(configsEqual(before, after)).toBe(true)
    after.event.sessions.reverse()
    expect(configsEqual(before, after)).toBe(false)
  })
})

describe('configuration differences', () => {
  it('groups changes and highlights key fields', () => {
    const before = makeConfigs()
    const after = cloneConfigs(before)
    after.event.track = 'spa'
    after.settings.maxCarSlots += 5
    after.eventRules.mandatoryPitstopCount = before.eventRules.mandatoryPitstopCount + 1
    const diff = buildConfigDiff(before, after)
    expect(diff.total).toBe(3)
    expect(diff.sections.map(section => section.key)).toEqual(['settings', 'event', 'eventRules'])
    expect(diff.highlights.map(item => item.key)).toEqual(['track', 'maxCarSlots', 'mandatoryPitstopCount'])
  })

  it('counts password changes without exposing values', () => {
    const before = makeConfigs()
    const after = cloneConfigs(before)
    before.settings.adminPassword = 'old-secret'
    after.settings.adminPassword = 'new-secret'
    const diff = buildConfigDiff(before, after)
    const passwordChange = diff.changes.find(change => change.path.endsWith('adminPassword'))
    expect(passwordChange?.sensitive).toBe(true)
    expect(passwordChange?.before).toBeUndefined()
    expect(passwordChange?.after).toBeUndefined()
    expect(JSON.stringify(diff)).not.toContain('old-secret')
    expect(JSON.stringify(diff)).not.toContain('new-secret')
    expect(diff.highlights.find(item => item.key === 'passwords')?.sensitive).toBe(true)
  })

  it('summarizes sessions and list counts', () => {
    const configs = makeConfigs()
    configs.event.sessions = [
      { dayOfWeekend: 1, hourOfDay: 10, sessionDurationMinutes: 20, sessionType: 'P', timeMultiplier: 1 },
      { dayOfWeekend: 2, hourOfDay: 14, sessionDurationMinutes: 45, sessionType: 'R', timeMultiplier: 1 }
    ]
    configs.entryList.entries.push({
      teamName: 'Test', raceNumber: 1, defaultGridPosition: 1, ballastKg: 0, restrictor: 0,
      isServerAdmin: 0, forcedCarModel: -1, overrideCarModelForCustomCar: 0,
      overrideDriverInfo: 0, customCar: '', drivers: []
    })
    const summary = summarizeConfig(configs)
    expect(summary.sessions).toBe('P 20m · R 45m')
    expect(summary.entryCount).toBe(1)
  })
})
