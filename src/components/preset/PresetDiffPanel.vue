<template>
  <div class="preset-diff-panel">
    <div class="diff-heading">
      <strong>{{ title || t('preset.diffTitle') }}</strong>
      <Win11Tag :type="diff.total ? 'warning' : 'success'">
        {{ diff.total ? t('preset.diffCount').replace('{count}', String(diff.total)) : t('preset.noChanges') }}
      </Win11Tag>
    </div>

    <div v-if="diff.sections.length" class="diff-sections">
      <span v-for="section in diff.sections" :key="section.key">
        {{ sectionLabel(section.key) }} · {{ section.count }}
      </span>
    </div>

    <div v-if="diff.highlights.length" class="diff-highlights">
      <div v-for="item in diff.highlights" :key="item.key" class="diff-row">
        <span class="diff-label">{{ highlightLabel(item.key) }}</span>
        <span v-if="item.sensitive" class="diff-sensitive">{{ t('preset.changedRedacted') }}</span>
        <span v-else class="diff-values">
          <span>{{ formatHighlightValue(item.key, item.before) }}</span>
          <span class="diff-arrow">→</span>
          <strong>{{ formatHighlightValue(item.key, item.after) }}</strong>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatTrackName } from '../../types/defaults'
import { getCurrentLanguage, t, currentLanguage } from '../../i18n'
import type { ConfigDiff, ConfigDiffHighlight, ConfigSectionKey } from '../../utils/configDiff'
import { Win11Tag } from '../win11'

defineProps<{
  diff: ConfigDiff
  title?: string
}>()

const sectionKeys: Record<ConfigSectionKey, string> = {
  configuration: 'preset.sectionConfiguration',
  settings: 'preset.sectionSettings',
  event: 'preset.sectionEvent',
  eventRules: 'preset.sectionEventRules',
  assistRules: 'preset.sectionAssistRules',
  entryList: 'preset.sectionEntryList',
  bop: 'preset.sectionBop'
}

const highlightKeys: Record<ConfigDiffHighlight['key'], string> = {
  track: 'form.track',
  carGroup: 'form.carGroup',
  maxCarSlots: 'preset.maxCarSlots',
  sessions: 'preset.sessions',
  ambientTemp: 'preset.ambientTemp',
  cloudLevel: 'preset.cloudLevel',
  rain: 'preset.rain',
  weatherRandomness: 'preset.weatherRandomness',
  mandatoryPitstopCount: 'preset.mandatoryPitstopCount',
  entryCount: 'preset.entryCount',
  bopCount: 'preset.bopCount',
  passwords: 'preset.passwordFields'
}

function sectionLabel(key: ConfigSectionKey) {
  return t(sectionKeys[key])
}

function highlightLabel(key: ConfigDiffHighlight['key']) {
  return t(highlightKeys[key])
}

function formatHighlightValue(key: ConfigDiffHighlight['key'], value?: string | number) {
  void currentLanguage.value
  if (value === undefined || value === '') return t('preset.unset')
  if (key === 'track' && typeof value === 'string') return formatTrackName(value, getCurrentLanguage())
  if (key === 'ambientTemp') return `${value} °C`
  if (key === 'cloudLevel' || key === 'rain' || key === 'weatherRandomness') {
    return `${Math.round(Number(value) * 100)}%`
  }
  return String(value)
}
</script>

<style scoped>
.preset-diff-panel{padding:12px;border:1px solid var(--win11-border);border-radius:9px;background:var(--win11-control-bg)}
.diff-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;color:var(--win11-text)}
.diff-sections{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
.diff-sections span{padding:3px 7px;border-radius:5px;background:var(--win11-surface);font-size:var(--type-caption);color:var(--win11-text-secondary)}
.diff-highlights{display:flex;flex-direction:column;gap:7px;margin-top:12px;padding-top:10px;border-top:1px solid var(--win11-border)}
.diff-row{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;font-size:var(--type-caption)}
.diff-label{flex-shrink:0;color:var(--win11-text-secondary)}
.diff-values{display:flex;align-items:center;justify-content:flex-end;gap:6px;min-width:0;text-align:right;color:var(--win11-text-secondary)}
.diff-values span:first-child,.diff-values strong{overflow-wrap:anywhere}.diff-values strong{color:var(--win11-text)}
.diff-arrow{color:var(--win11-accent)}.diff-sensitive{font-weight:var(--weight-emphasis);color:#c9851b}
</style>
