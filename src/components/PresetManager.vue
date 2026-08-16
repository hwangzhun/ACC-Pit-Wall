<template>
  <Win11Dialog
    v-model="visible"
    :title="t('preset.title')"
    width="min(920px, calc(100vw - 32px))"
    @open="$emit('refresh')"
  >
    <div class="manager-toolbar">
      <div>
        <strong>{{ t('preset.managerHeading') }}</strong>
        <span>{{ t('preset.managerHint') }}</span>
      </div>
      <Win11Button variant="primary" :disabled="busy" @click="$emit('save-as')">+ {{ t('preset.saveAsCurrent') }}</Win11Button>
    </div>

    <div class="preset-manager">
      <section class="preset-list">
        <Win11Input
          v-model="searchQuery"
          :placeholder="t('preset.searchPlaceholder')"
          prefix-icon="search"
          clearable
          size="small"
        />
        <div class="preset-list-content">
          <div v-if="!filteredPresets.length" class="preset-empty">
            <strong>{{ searchQuery ? t('preset.noSearchResults') : t('preset.noPresets') }}</strong>
            <span>{{ searchQuery ? t('preset.tryAnotherSearch') : t('preset.saveFirstHint') }}</span>
          </div>
          <button
            v-for="preset in filteredPresets"
            :key="preset.name"
            type="button"
            class="preset-item"
            :class="{ selected: selectedPresetName === preset.name, active: activePresetName === preset.name }"
            :disabled="busy"
            @click="$emit('select', preset.name)"
          >
            <div class="preset-name-row">
              <strong :title="preset.name">{{ preset.name }}</strong>
              <Win11Tag v-if="activePresetName === preset.name" size="small" type="success">{{ t('preset.inUse') }}</Win11Tag>
            </div>
            <div class="preset-tags">
              <span>{{ trackLabel(preset.track) }}</span>
              <span>{{ preset.carGroup || t('preset.unset') }}</span>
            </div>
            <small>{{ formatDate(preset.updatedAt) }}</small>
          </button>
        </div>
      </section>

      <section class="preset-detail">
        <div v-if="detailLoading" class="detail-state">{{ t('common.loading') }}</div>
        <template v-else-if="selectedPresetDetails">
          <div class="detail-heading">
            <div>
              <span>{{ selectedIsActive ? t('preset.inUse') : t('preset.selectedPreset') }}</span>
              <h3>{{ selectedPresetDetails.name }}</h3>
              <p v-if="selectedPresetDetails.description">{{ selectedPresetDetails.description }}</p>
            </div>
            <div class="secondary-menu-wrap">
              <Win11Button size="small" variant="ghost" :disabled="busy" @click="showSecondaryMenu = !showSecondaryMenu">•••</Win11Button>
              <div v-if="showSecondaryMenu" class="secondary-menu">
                <button type="button" @click="openRename">{{ t('preset.renameAction') }}</button>
                <button type="button" class="danger" @click="requestDelete">{{ t('common.delete') }}</button>
              </div>
            </div>
          </div>

          <div class="summary-grid">
            <div><span>{{ t('form.track') }}</span><strong>{{ trackLabel(summary.track) }}</strong></div>
            <div><span>{{ t('form.carGroup') }}</span><strong>{{ summary.carGroup || t('preset.unset') }}</strong></div>
            <div class="wide"><span>{{ t('preset.sessions') }}</span><strong>{{ summary.sessions || t('preset.unset') }}</strong></div>
            <div><span>{{ t('preset.weather') }}</span><strong>{{ weatherSummary }}</strong></div>
            <div><span>{{ t('preset.maxCarSlots') }}</span><strong>{{ summary.maxCarSlots }}</strong></div>
            <div><span>{{ t('preset.entryCount') }}</span><strong>{{ summary.entryCount }}</strong></div>
            <div><span>{{ t('preset.mandatoryPitstopCount') }}</span><strong>{{ summary.mandatoryPitstopCount }}</strong></div>
            <div><span>{{ t('preset.tyreSetCount') }}</span><strong>{{ summary.tyreSetCount }}</strong></div>
            <div><span>{{ t('preset.bopCount') }}</span><strong>{{ summary.bopCount }}</strong></div>
            <div><span>{{ t('preset.restrictedAssistCount') }}</span><strong>{{ summary.restrictedAssistCount }}</strong></div>
          </div>

          <PresetDiffPanel :diff="comparisonDiff" :title="t('preset.compareCurrent')" />

          <div class="detail-actions">
            <template v-if="selectedIsActive">
              <Win11Button v-if="isDirty" variant="primary" :loading="busy" @click="$emit('update-active')">
                {{ t('preset.saveChanges') }}
              </Win11Button>
              <Win11Button v-if="isDirty" variant="secondary" :disabled="busy" @click="$emit('restore-active')">
                {{ t('preset.restoreSaved') }}
              </Win11Button>
              <Win11Button v-else variant="success" disabled>{{ t('preset.currentlyInUse') }}</Win11Button>
            </template>
            <Win11Button v-else variant="success" :loading="busy" @click="$emit('apply', selectedPresetDetails.name)">
              {{ t('preset.applyPreset') }}
            </Win11Button>
          </div>
        </template>
        <div v-else class="detail-state">
          <strong>{{ t('preset.emptySelect') }}</strong>
          <span>{{ t('preset.previewHint') }}</span>
        </div>
      </section>
    </div>
  </Win11Dialog>

  <Win11Dialog v-model="renameVisible" :title="t('preset.renameDialogTitle')" width="min(500px, calc(100vw - 32px))" :z-index="3100">
    <div class="rename-form">
      <label>{{ t('preset.newName') }}</label>
      <Win11Input v-model="renameName" :placeholder="t('preset.placeholderNewName')" />
      <label>{{ t('preset.description') }}</label>
      <textarea v-model="renameDescription" class="win11-textarea" :rows="3"></textarea>
    </div>
    <template #footer>
      <Win11Button variant="secondary" :disabled="busy" @click="renameVisible = false">{{ t('common.cancel') }}</Win11Button>
      <Win11Button variant="primary" :loading="busy" :disabled="!renameName.trim()" @click="submitRename">{{ t('common.confirm') }}</Win11Button>
    </template>
  </Win11Dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { AllConfigs } from '../types/configuration'
import { formatTrackName } from '../types/defaults'
import { getCurrentLanguage, t, currentLanguage } from '../i18n'
import type { Preset, PresetWithData } from '../utils/presetManager'
import { buildConfigDiff, summarizeConfig } from '../utils/configDiff'
import { Win11Button, Win11Dialog, Win11Input, Win11Tag } from './win11'
import PresetDiffPanel from './preset/PresetDiffPanel.vue'

const props = defineProps<{
  modelValue: boolean
  presets: Preset[]
  configs: AllConfigs
  activePresetName: string | null
  selectedPresetName: string | null
  selectedPresetDetails: PresetWithData | null
  isDirty: boolean
  busy: boolean
  detailLoading: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  refresh: []
  select: [name: string]
  apply: [name: string]
  'save-as': []
  'update-active': []
  'restore-active': []
  rename: [payload: { name: string; description: string }]
  delete: []
}>()

const visible = computed({ get: () => props.modelValue, set: value => emit('update:modelValue', value) })
const searchQuery = ref('')
const showSecondaryMenu = ref(false)
const renameVisible = ref(false)
const renameName = ref('')
const renameDescription = ref('')

const filteredPresets = computed(() => {
  void currentLanguage.value
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return props.presets
  return props.presets.filter(preset => [
    preset.name,
    preset.description,
    preset.track,
    preset.track ? formatTrackName(preset.track, 'zh') : '',
    preset.track ? formatTrackName(preset.track, 'en') : '',
    preset.carGroup
  ].some(value => (value || '').toLowerCase().includes(query)))
})

const selectedIsActive = computed(() => props.selectedPresetName === props.activePresetName)
const summary = computed(() => summarizeConfig(props.selectedPresetDetails!.configs))
const comparisonDiff = computed(() => buildConfigDiff(props.configs, props.selectedPresetDetails!.configs))
const weatherSummary = computed(() => {
  const value = summary.value
  return `${value.ambientTemp}°C · ☁ ${Math.round(value.cloudLevel * 100)}% · ☂ ${Math.round(value.rain * 100)}% · RNG ${Math.round(value.weatherRandomness * 100)}%`
})

function trackLabel(track?: string) {
  void currentLanguage.value
  return track ? formatTrackName(track, getCurrentLanguage()) : t('preset.unset')
}

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(getCurrentLanguage() === 'zh' ? 'zh-CN' : 'en-US')
}

function openRename() {
  showSecondaryMenu.value = false
  renameName.value = props.selectedPresetDetails?.name || ''
  renameDescription.value = props.selectedPresetDetails?.description || ''
  renameVisible.value = true
}

function submitRename() {
  if (!renameName.value.trim()) return
  emit('rename', { name: renameName.value.trim(), description: renameDescription.value.trim() })
  renameVisible.value = false
}

function requestDelete() {
  showSecondaryMenu.value = false
  emit('delete')
}
</script>

<style scoped>
.manager-toolbar{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:14px}.manager-toolbar>div{min-width:0}.manager-toolbar strong{display:block;color:var(--win11-text)}.manager-toolbar span{display:block;margin-top:3px;font-size:var(--type-caption);color:var(--win11-text-secondary)}.preset-manager{display:grid;grid-template-columns:300px minmax(0,1fr);height:min(570px,calc(90vh - 150px));border:1px solid var(--win11-border);border-radius:10px;overflow:hidden}.preset-list{display:flex;flex-direction:column;gap:10px;padding:12px;border-right:1px solid var(--win11-border);min-height:0}.preset-list-content{flex:1;overflow:auto}.preset-item{display:block;width:100%;padding:11px;margin-bottom:5px;text-align:left;border:1px solid transparent;border-radius:8px;background:transparent;color:var(--win11-text);cursor:pointer}.preset-item:hover{background:var(--win11-control-hover-bg)}.preset-item.selected{background:var(--win11-control-bg);border-color:var(--win11-accent)}.preset-item.active:not(.selected){border-left:3px solid #258c5b}.preset-name-row{display:flex;align-items:center;justify-content:space-between;gap:7px}.preset-name-row strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.preset-tags{display:flex;gap:5px;margin-top:7px}.preset-tags span{max-width:50%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:2px 6px;border-radius:4px;background:var(--win11-surface);font-size:var(--type-caption);color:var(--win11-text-secondary)}.preset-item small{display:block;margin-top:6px;color:var(--win11-text-secondary)}.preset-empty,.detail-state{display:flex;min-height:180px;flex-direction:column;align-items:center;justify-content:center;gap:5px;text-align:center;color:var(--win11-text-secondary)}.preset-empty strong,.detail-state strong{color:var(--win11-text)}.preset-empty span,.detail-state span{font-size:var(--type-caption)}.preset-detail{min-width:0;overflow:auto;padding:17px}.detail-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.detail-heading>div:first-child{min-width:0}.detail-heading span{font-size:var(--type-caption);font-weight:var(--weight-emphasis);color:var(--win11-accent)}.detail-heading h3{margin:3px 0 0;overflow-wrap:anywhere;color:var(--win11-text)}.detail-heading p{margin:6px 0 0;color:var(--win11-text-secondary)}.secondary-menu-wrap{position:relative}.secondary-menu{position:absolute;right:0;top:34px;z-index:5;min-width:130px;padding:5px;border:1px solid var(--win11-border);border-radius:8px;background:var(--win11-surface);box-shadow:var(--win11-shadow-dialog)}.secondary-menu button{display:block;width:100%;padding:7px 9px;border:0;border-radius:5px;text-align:left;background:transparent;color:var(--win11-text);cursor:pointer}.secondary-menu button:hover{background:var(--win11-control-hover-bg)}.secondary-menu button.danger{color:#d13438}.summary-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin:15px 0}.summary-grid>div{min-width:0;padding:8px 9px;border:1px solid var(--win11-border);border-radius:7px;background:var(--win11-control-bg)}.summary-grid .wide{grid-column:span 2}.summary-grid span{display:block;font-size:var(--type-caption);color:var(--win11-text-secondary)}.summary-grid strong{display:block;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:var(--type-caption);color:var(--win11-text)}.detail-actions{display:flex;gap:9px;margin-top:14px}.rename-form{display:flex;flex-direction:column;gap:8px}.rename-form label{margin-top:8px;font-weight:var(--weight-emphasis);color:var(--win11-text)}.win11-textarea{width:100%;padding:10px 12px;color:var(--win11-text);background:var(--win11-control-bg);border:1px solid var(--win11-border);border-radius:6px;resize:vertical;outline:none}@media(max-width:720px){.manager-toolbar{align-items:flex-start;flex-direction:column}.preset-manager{grid-template-columns:1fr;height:min(680px,calc(90vh - 180px));overflow:auto}.preset-list{max-height:270px;border-right:0;border-bottom:1px solid var(--win11-border)}.preset-detail{overflow:visible}.summary-grid{grid-template-columns:1fr 1fr}.summary-grid .wide{grid-column:1/-1}}
</style>
