<template>
  <Win11Dialog
    v-model="dialogVisible"
    :title="t('bop.importFromLfm')"
    width="500px"
  >
    <div class="import-dialog-content">
      <Win11Alert
        :title="t('bop.importInstructions')"
        :description="t('bop.importDescription')"
        type="info"
        show-icon
        :closable="false"
        class="import-info"
      />

      <div v-if="cacheStatus?.exists" class="cache-status">
        <Win11Tag :type="cacheStatus.isValid ? 'success' : 'warning'" size="small">
          {{ cacheStatus.isValid ? t('bop.cacheValid') : t('bop.cacheExpired') }}
        </Win11Tag>
        <span class="cache-info">
          {{ t('bop.cachedAt') }} {{ formatCacheDate(cacheStatus.timestamp) }}
        </span>
        <Win11Button
          v-if="!cacheStatus.isValid"
          variant="primary"
          size="small"
          :loading="isRefreshing"
          @click="handleRefreshCache"
        >
          {{ t('bop.refreshCache') }}
        </Win11Button>
      </div>

      <div class="import-form">
        <div class="win11-form-field">
          <label class="win11-form-label">{{ t('form.track') }}</label>
          <Win11Select
            v-model="importForm.track"
            :options="trackOptions"
            :placeholder="t('common.pleaseSelect')"
            filterable
            style="width: 100%"
          />
        </div>

        <div class="win11-form-field">
          <label class="win11-form-label">{{ t('bop.carClass') }}</label>
          <Win11Select
            v-model="importForm.carClass"
            :options="carClassOptions"
            :placeholder="t('common.pleaseSelect')"
            filterable
            style="width: 100%"
          />
        </div>
      </div>

      <div v-if="isLoading" class="loading-state">
        <svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>{{ loadingMessage }}</span>
      </div>

      <Win11Alert
        v-if="errorMessage"
        type="error"
        show-icon
        closable
        @close="errorMessage = ''"
        class="error-alert"
      >
        <template #title>{{ t('common.error') }}</template>
        {{ errorMessage }}
      </Win11Alert>

      <div v-if="previewData && !isLoading" class="import-preview">
        <h5>{{ t('bop.importPreview') }}</h5>
        <div class="preview-stats">
          <div class="stat-row">
            <span class="stat-label">{{ t('bop.entryCount') }}:</span>
            <span class="stat-value">{{ previewData.entryCount }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">{{ t('form.track') }}:</span>
            <span class="stat-value">{{ previewData.track }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">{{ t('bop.carClass') }}:</span>
            <span class="stat-value">{{ previewData.carClass }}</span>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <Win11Button variant="secondary" @click="handleCancel">{{ t('common.cancel') }}</Win11Button>
      <Win11Button
        variant="primary"
        :loading="isImporting"
        :disabled="isLoading || !previewData || previewData.entryCount === 0"
        @click="handleConfirmImport"
      >
        {{ t('common.confirm') }}
      </Win11Button>
    </template>
  </Win11Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Win11Dialog, Win11Button, Win11Select, Win11Tag, Win11Alert, notify } from '../win11'
import { TRACKS } from '../../types/defaults'
import type { BopEntry } from '../../types/configuration'
import type { CarClass } from '../../utils/lfmBopService'
import {
  carClassRanges,
  getCarIdByLfmName,
  normalizeTrackName
} from '../../utils/lfmBopService'
import { useTrackName } from '../../i18n/mappings'
import {
  fetchAllLfmBop,
  getLfmBopStatus,
  refreshLfmBopCache,
  transformServerBopToEntries
} from '../../services/lfmApi'
import { t } from '../../i18n'

interface CacheStatus {
  exists: boolean
  isValid: boolean
  timestamp: number
}

const props = defineProps<{
  modelValue: boolean
  currentTrack?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'import-entries': [entries: BopEntry[]]
}>()

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const defaultImportTrack = TRACKS[0] ?? 'monza'
const initialImportTrack = () => props.currentTrack?.trim() || defaultImportTrack
const importForm = ref({
  track: initialImportTrack(),
  carClass: 'all' as CarClass | 'all'
})

const cacheStatus = ref<CacheStatus | null>(null)
const fullEntries = ref<BopEntry[]>([])
const isLoading = ref(false)
const isRefreshing = ref(false)
const isImporting = ref(false)
const loadingMessage = ref('')
const errorMessage = ref('')

const trackOptions = computed(() =>
  Array.from(new Set([
    ...TRACKS,
    ...(props.currentTrack?.trim() ? [props.currentTrack.trim()] : [])
  ])).map(track => ({
    value: track,
    label: useTrackName(track).value
  }))
)

const carClassOptions = [
  { value: 'all', label: t('bop.allClasses') },
  { value: 'GT3', label: 'GT3' },
  { value: 'GT4', label: 'GT4' },
  { value: 'GT2', label: 'GT2' }
]

const formatTrackName = (track: string) => {
  return useTrackName(track).value
}

const previewData = computed(() => {
  if (!fullEntries.value.length) return null
  const filtered = filterEntries(
    fullEntries.value,
    importForm.value.track,
    importForm.value.carClass
  )
  const trackLabel = formatTrackName(importForm.value.track)
  const classLabel =
    importForm.value.carClass === 'all'
      ? t('bop.allClasses')
      : importForm.value.carClass
  return {
    entryCount: filtered.length,
    track: trackLabel,
    carClass: classLabel
  }
})

function filterEntries(
  entries: BopEntry[],
  track: string,
  carClass: CarClass | 'all'
): BopEntry[] {
  return entries.filter((e) => {
    const nt = normalizeTrackName(e.track)
    if (nt !== normalizeTrackName(track)) {
      return false
    }
    if (carClass === 'all') return true
    const r = carClassRanges[carClass]
    return e.carModel >= r.min && e.carModel <= r.max
  })
}

function formatCacheDate(timestamp: number): string {
  if (!timestamp) return t('bop.unknown')
  const ms = timestamp > 1e12 ? timestamp : timestamp * 1000
  return new Date(ms).toLocaleDateString()
}

async function loadCacheStatus() {
  try {
    const s = await getLfmBopStatus()
    if (s.success) {
      cacheStatus.value = {
        exists: s.exists,
        isValid: s.isValid,
        timestamp: s.timestamp ?? 0
      }
    } else {
      cacheStatus.value = null
    }
  } catch {
    cacheStatus.value = null
  }
}

async function loadFullBopEntries() {
  isLoading.value = true
  loadingMessage.value = t('bop.fetchingData')
  errorMessage.value = ''
  fullEntries.value = []
  try {
    const res = await fetchAllLfmBop(false)
    if (res.success && Array.isArray(res.data) && res.data.length > 0) {
      fullEntries.value = transformServerBopToEntries(
        res.data,
        'all',
        'all',
        getCarIdByLfmName,
        normalizeTrackName
      )
    }
    
    await loadCacheStatus()
    
    if (fullEntries.value.length === 0) {
      errorMessage.value = t('bop.fetchFailed')
    }
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : t('bop.fetchFailed')
  } finally {
    isLoading.value = false
    loadingMessage.value = ''
  }
}

async function handleRefreshCache() {
  isRefreshing.value = true
  loadingMessage.value = t('bop.refreshingCache')
  errorMessage.value = ''
  try {
    await refreshLfmBopCache()
    await loadCacheStatus()
    await loadFullBopEntries()
    notify.success(t('bop.cacheRefreshed'))
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : t('bop.cacheRefreshFailed')
  } finally {
    isRefreshing.value = false
    loadingMessage.value = ''
  }
}

async function handleConfirmImport() {
  isImporting.value = true
  errorMessage.value = ''
  try {
    if (fullEntries.value.length === 0) {
      await loadFullBopEntries()
    }
    const filtered = filterEntries(
      fullEntries.value,
      importForm.value.track,
      importForm.value.carClass
    )
    if (filtered.length === 0) {
      errorMessage.value = t('common.noData')
      return
    }
    emit('import-entries', filtered)
    dialogVisible.value = false
    resetForm()
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : t('bop.fetchFailed')
  } finally {
    isImporting.value = false
  }
}

function handleCancel() {
  dialogVisible.value = false
  resetForm()
}

function resetForm() {
  importForm.value = { track: initialImportTrack(), carClass: 'all' }
  fullEntries.value = []
  errorMessage.value = ''
}

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    resetForm()
    loadCacheStatus()
    loadFullBopEntries()
  } else {
    fullEntries.value = []
  }
})
</script>

<style scoped>
.import-dialog-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.cache-status {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--win11-control-bg);
  border-radius: 8px;
}

.cache-info {
  font-size: var(--type-caption);
  color: var(--win11-text-secondary);
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px;
  color: var(--win11-accent);
}

.error-alert {
  margin-top: 8px;
}

.import-preview {
  padding: 12px;
  background: var(--win11-control-bg);
  border-radius: 8px;
}

.import-preview h5 {
  margin: 0 0 12px 0;
  font-size: var(--type-body);
  font-weight: var(--weight-emphasis);
  color: var(--win11-text);
}

.preview-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
}

.stat-label {
  font-weight: var(--weight-emphasis);
  color: var(--win11-text-secondary);
}

.stat-value {
  font-weight: var(--weight-emphasis);
  color: var(--win11-text);
}

.win11-form-field {
  @apply flex flex-col gap-2;
}

.win11-form-label {
  @apply text-sm font-medium text-win11-text;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
