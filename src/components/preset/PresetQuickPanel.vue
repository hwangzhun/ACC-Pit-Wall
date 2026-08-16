<template>
  <section class="preset-workspace" :class="{ 'is-dirty': isDirty }">
    <header class="workspace-header">
      <div class="workspace-label">
        <span class="status-dot" :class="{ dirty: isDirty, active: activePresetName && !isDirty }"></span>
        <span>{{ t('preset.currentPresetBanner') }}</span>
      </div>
      <Win11Tag v-if="isDirty" type="warning" size="small">{{ t('preset.modified') }}</Win11Tag>
      <Win11Tag v-else-if="activePresetName" type="success" size="small">{{ t('preset.inUse') }}</Win11Tag>
    </header>

    <div class="current-preset" :title="displayName">
      <strong>{{ displayName }}</strong>
      <span>{{ activePresetName ? currentPresetMeta : t('preset.saveFirstHint') }}</span>
    </div>

    <div class="quick-switch">
      <span class="control-label">{{ t('preset.quickSwitchPlaceholder') }}</span>
      <Win11Select
        :model-value="activePresetName || ''"
        :options="options"
        :placeholder="presets.length ? t('preset.quickSwitchPlaceholder') : t('preset.noPresets')"
        :disabled="busy || !presets.length"
        filterable
        @change="handleSelect"
      />
    </div>

    <div class="workspace-actions">
      <Win11Button
        size="small"
        variant="primary"
        :disabled="!activePresetName || !isDirty"
        :loading="busy"
        @click="$emit('save-active')"
      >
        {{ t('preset.saveChanges') }}
      </Win11Button>
      <Win11Button size="small" variant="secondary" :disabled="busy" @click="$emit('save-as')">
        {{ t('preset.saveAs') }}
      </Win11Button>
    </div>

    <button type="button" class="manage-link" :disabled="busy" @click="$emit('manage')">
      <span>{{ t('preset.openManager') }}</span>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>
    </button>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import '../../i18n/presetLocaleExtensions'
import { t } from '../../i18n'
import type { Preset } from '../../utils/presetManager'
import { Win11Button, Win11Select, Win11Tag } from '../win11'

const props = defineProps<{
  presets: Preset[]
  activePresetName: string | null
  isDirty: boolean
  busy: boolean
}>()

const emit = defineEmits<{
  select: [name: string]
  'save-active': []
  'save-as': []
  manage: []
}>()

const displayName = computed(() => props.activePresetName || t('preset.temporaryConfig'))
const activePreset = computed(() => props.presets.find(preset => preset.name === props.activePresetName))
const currentPresetMeta = computed(() => {
  const preset = activePreset.value
  return [preset?.track, preset?.carGroup].filter(Boolean).join(' · ') || t('preset.currentlyInUse')
})
const options = computed(() => props.presets.map(preset => ({
  value: preset.name,
  label: [preset.name, preset.track, preset.carGroup].filter(Boolean).join(' · ')
})))

function handleSelect(value: string | number) {
  const name = String(value)
  if (name && name !== props.activePresetName) emit('select', name)
}
</script>

<style scoped>
.preset-workspace{display:flex;min-width:0;flex-direction:column;gap:9px}.workspace-header{display:flex;min-width:0;align-items:center;justify-content:space-between;gap:8px}.workspace-label{display:flex;min-width:0;align-items:center;gap:7px;font-size:var(--type-caption);font-weight:var(--weight-emphasis);color:var(--win11-text-secondary);text-transform:uppercase;letter-spacing:.035em}.status-dot{width:8px;height:8px;border-radius:50%;background:var(--win11-text-secondary);flex-shrink:0}.status-dot.active{background:#258c5b;box-shadow:0 0 0 3px rgba(37,140,91,.12)}.status-dot.dirty{background:#c9851b;box-shadow:0 0 0 3px rgba(201,133,27,.12)}.current-preset{min-width:0;padding:9px 10px;border:1px solid var(--win11-border);border-radius:7px;background:var(--win11-control-bg)}.current-preset strong{display:-webkit-box;overflow:hidden;-webkit-box-orient:vertical;-webkit-line-clamp:2;line-clamp:2;overflow-wrap:anywhere;font-size:var(--type-body);line-height:1.35;color:var(--win11-text)}.current-preset span{display:block;margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:var(--type-caption);color:var(--win11-text-secondary)}.is-dirty .current-preset{border-color:color-mix(in srgb,#c9851b 45%,var(--win11-border));background:color-mix(in srgb,#c9851b 7%,var(--win11-control-bg))}.quick-switch{min-width:0}.control-label{display:block;margin:0 0 4px 2px;font-size:11px;color:var(--win11-text-secondary)}.quick-switch :deep(.win11-select-trigger){height:34px;padding-inline:10px}.quick-switch :deep(.win11-select-trigger > span){min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.quick-switch :deep(.win11-select-dropdown){top:auto;bottom:calc(100% + 5px);margin-top:0;max-height:min(320px,55vh)}.quick-switch :deep(.win11-select-options){max-height:min(260px,45vh)}.workspace-actions{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:7px}.workspace-actions :deep(.win11-button){width:100%;min-width:0;padding-inline:7px}.workspace-actions :deep(.win11-button__text){overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.manage-link{display:flex;align-items:center;justify-content:space-between;width:100%;padding:4px 2px 0;border:0;border-top:1px solid var(--win11-border);background:transparent;color:var(--win11-accent);font-size:var(--type-caption);cursor:pointer}.manage-link span{padding-top:4px}.manage-link svg{width:14px;height:14px;margin-top:4px;transition:transform .15s}.manage-link:hover svg{transform:translateX(2px)}.manage-link:disabled{opacity:.5;cursor:not-allowed}:global(.win11-sidebar-nav){min-height:0;overflow-y:auto}:global(.win11-sidebar-footer){flex-shrink:0}
</style>
