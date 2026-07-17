<template>
  <div class="bop-container">
    <Win11Card>
      <template #title>
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-md bg-win11-accent/10 flex items-center justify-center">
            <svg class="w-5 h-5 text-win11-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
          </div>
          <div>
            <h3 class="text-base font-semibold text-win11-text m-0">{{ t('nav.bop') }}</h3>
            <p class="text-xs text-win11-text-secondary m-0">Balance of Performance</p>
          </div>
        </div>
      </template>

      <div class="space-y-5">
        <div class="filter-bar">
          <Win11Select v-model="selectedTrack" :options="trackOptions" class="filter-select track-filter" />
          <Win11Select v-model="selectedClass" :options="classOptions" class="filter-select" />
          <Win11Input v-model="searchKeyword" :placeholder="t('bop.searchHint')" clearable prefix-icon="search" class="search-input" />
          <label class="changed-only">
            <input v-model="changedOnly" type="checkbox" />
            <span>{{ t('bop.changedOnly') }}</span>
          </label>
        </div>

        <section class="bop-summary summary-cards" :aria-label="t('bop.summary')">
          <article><span>{{ t('bop.visibleEntries') }}</span><strong>{{ summary.total }}</strong></article>
          <article class="positive"><span>{{ t('bop.addedBallast') }}</span><strong>{{ summary.positive }}</strong></article>
          <article class="negative"><span>{{ t('bop.reducedBallast') }}</span><strong>{{ summary.negative }}</strong></article>
          <article class="restricted"><span>{{ t('bop.restrictorActive') }}</span><strong>{{ summary.restricted }}</strong></article>
          <article :class="{ warning: summary.duplicates > 0 }"><span>{{ t('bop.duplicateEntries') }}</span><strong>{{ summary.duplicates }}</strong></article>
        </section>

        <div class="win11-toolbar">
          <div class="win11-toolbar-left">
            <span class="result-count">{{ filteredEntries.length }} {{ t('common.items') }}</span>
            <span v-if="selectedRows.length" class="selected-count">{{ t('common.selected').replace('{count}', selectedRows.length.toString()) }}</span>
          </div>
          <div class="win11-toolbar-right">
            <Win11Button v-if="selectedRows.length" variant="danger" @click="handleBatchDelete">
              {{ t('common.batchDelete') }} ({{ selectedRows.length }})
            </Win11Button>
            <Win11Button variant="secondary" @click="showImportDialog = true">{{ t('bop.importFromLfm') }}</Win11Button>
            <Win11Button variant="primary" @click="handleAddEntry">{{ t('bop.addEntry') }}</Win11Button>
          </div>
        </div>

        <div class="data-table-section">
          <BopDataTable
            ref="tableRef"
            :entries="filteredEntries"
            :selected-count="selectedRows.length"
            @edit="handleEdit"
            @delete="handleDelete"
            @selectionChange="handleSelectionChange"
          />
        </div>
      </div>
    </Win11Card>

    <BopImportDialog
      v-model="showImportDialog"
      :current-track="currentTrack"
      @import-entries="handleImportEntries"
    />
    <Win11Dialog v-model="editingDialogVisible" :title="t('title.editBop')" width="760px" @close="handleCancelEdit">
      <div class="edit-dialog-body">
        <BopEditPanel v-if="editingEntry" :entry="editingEntry" @save="handleSave" @cancel="handleCancelEdit" />
      </div>
    </Win11Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Bop, BopEntry } from '../../types/configuration'
import BopDataTable from './BopDataTable.vue'
import BopEditPanel from './BopEditPanel.vue'
import BopImportDialog from './BopImportDialog.vue'
import { t } from '../../i18n'
import { getCarLocalizedName, useTrackName } from '../../i18n/mappings'
import { getCarClass } from './utils'
import { Win11Card, Win11Input, Win11Button, Win11Dialog, Win11Select } from '../win11'

const props = defineProps<{
  bop: Bop
  currentTrack?: string
}>()
const emit = defineEmits<{ (e: 'update:bop', value: Bop): void }>()
const bopRef = ref<Bop>(props.bop)
watch(() => props.bop, value => { bopRef.value = value }, { deep: true })
watch(bopRef, value => emit('update:bop', value), { deep: true })
const entries = computed({ get: () => bopRef.value.entries, set: value => { bopRef.value.entries = value } })

const searchKeyword = ref('')
const selectedTrack = ref('all')
const selectedClass = ref('all')
const changedOnly = ref(false)
const selectedRows = ref<BopEntry[]>([])
const editingEntry = ref<BopEntry | null>(null)
const showImportDialog = ref(false)
const tableRef = ref<InstanceType<typeof BopDataTable> | null>(null)
const editingDialogVisible = computed({ get: () => editingEntry.value !== null, set: visible => { if (!visible) editingEntry.value = null } })

const trackOptions = computed(() => [
  { label: t('bop.allTracks'), value: 'all' },
  ...Array.from(new Set([
    ...entries.value.map(entry => entry.track),
    ...(props.currentTrack?.trim() ? [props.currentTrack.trim()] : [])
  ])).sort().map(track => ({ label: useTrackName(track).value, value: track }))
])
const classOptions = computed(() => [
  { label: t('bop.allClasses'), value: 'all' },
  { label: 'GT3', value: 'GT3' }, { label: 'GT4', value: 'GT4' }, { label: 'GT2', value: 'GT2' }
])

const filteredEntries = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase()
  return entries.value.filter(entry => {
    if (selectedTrack.value !== 'all' && entry.track !== selectedTrack.value) return false
    if (selectedClass.value !== 'all' && getCarClass(entry.carModel) !== selectedClass.value) return false
    if (changedOnly.value && entry.ballastKg === 0 && entry.restrictor === 0) return false
    if (!keyword) return true
    return entry.track.toLowerCase().includes(keyword) ||
      useTrackName(entry.track).value.toLowerCase().includes(keyword) ||
      getCarLocalizedName(entry.carModel).toLowerCase().includes(keyword) ||
      String(entry.carModel).includes(keyword)
  })
})

const summary = computed(() => {
  const visible = filteredEntries.value
  const keys = new Set<string>()
  let duplicates = 0
  for (const entry of visible) {
    const key = entryKey(entry)
    if (keys.has(key)) duplicates++
    keys.add(key)
  }
  return {
    total: visible.length,
    positive: visible.filter(entry => entry.ballastKg > 0).length,
    negative: visible.filter(entry => entry.ballastKg < 0).length,
    restricted: visible.filter(entry => entry.restrictor > 0).length,
    duplicates
  }
})

watch([selectedTrack, selectedClass, changedOnly], clearSelection)
function entryKey(entry: BopEntry) { return `${entry.track}:${entry.carModel}` }
function clearSelection() { selectedRows.value = []; tableRef.value?.clearSelection() }
function handleSelectionChange(rows: BopEntry[]) { selectedRows.value = rows }
function handleEdit(entry: BopEntry) { editingEntry.value = { ...entry } }
function handleDelete(entry: BopEntry) { entries.value = entries.value.filter(item => entryKey(item) !== entryKey(entry)); clearSelection() }
function handleBatchDelete() { const keys = new Set(selectedRows.value.map(entryKey)); entries.value = entries.value.filter(item => !keys.has(entryKey(item))); clearSelection() }
function handleAddEntry() {
  const track = selectedTrack.value === 'all'
    ? props.currentTrack?.trim() || 'monza'
    : selectedTrack.value
  editingEntry.value = { track, carModel: 0, ballastKg: 0, restrictor: 0 }
}
function handleSave(entry: BopEntry) { const index = entries.value.findIndex(item => entryKey(item) === entryKey(entry)); if (index >= 0) entries.value[index] = entry; else entries.value.push(entry); editingEntry.value = null }
function handleCancelEdit() { editingEntry.value = null }
function handleImportEntries(imported: BopEntry[]) { const merged = new Map(entries.value.map(entry => [entryKey(entry), entry])); imported.forEach(entry => merged.set(entryKey(entry), entry)); entries.value = Array.from(merged.values()); clearSelection() }
</script>

<style scoped>
.bop-container{@apply space-y-6}.filter-bar{display:grid;grid-template-columns:minmax(180px,1.1fr) minmax(130px,.7fr) minmax(220px,1.4fr) auto;gap:10px;align-items:center;padding:12px;border:1px solid var(--win11-border);border-radius:10px;background:var(--win11-surface)}.filter-select,.search-input{width:100%}.changed-only{display:flex;align-items:center;gap:8px;min-height:34px;padding:0 10px;border-radius:7px;color:var(--win11-text);font-size: var(--type-caption);white-space:nowrap;cursor:pointer}.changed-only input{accent-color:var(--win11-accent)}.bop-summary{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}.bop-summary article{display:flex;flex-direction:column;gap:4px;padding:12px 14px;border:1px solid var(--win11-border);border-radius:10px;background:var(--win11-control-bg)}.bop-summary span{font-size: var(--type-caption);color:var(--win11-text-secondary)}.bop-summary strong{font-size: var(--type-metric);line-height:1;color:var(--win11-text)}.bop-summary .positive strong{color:#d85b3f}.bop-summary .negative strong{color:#258c5b}.bop-summary .restricted strong{color:#d28a10}.bop-summary .warning{border-color:#d85b3f}.bop-summary .warning strong{color:#d85b3f}.win11-toolbar{@apply flex items-center justify-between;@apply bg-win11-surface rounded-lg p-3}.win11-toolbar-left,.win11-toolbar-right{@apply flex items-center gap-3}.result-count{font-size: var(--type-body);color:var(--win11-text-secondary)}.selected-count{font-size: var(--type-caption);color:var(--win11-accent)}.data-table-section{@apply bg-win11-surface rounded-lg p-4}.edit-dialog-body{height:min(72vh,720px)}@media(max-width:900px){.filter-bar{grid-template-columns:1fr 1fr}.bop-summary{grid-template-columns:repeat(3,1fr)}}
</style>
