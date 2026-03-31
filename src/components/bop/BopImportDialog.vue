<template>
  <el-dialog
    v-model="dialogVisible"
    :title="t('bop.importFromLfm')"
    width="500px"
    :close-on-click-modal="false"
  >
    <div class="import-dialog-content">
      <el-alert
        :title="t('bop.importInstructions')"
        :description="t('bop.importDescription')"
        type="info"
        show-icon
        :closable="false"
        class="import-info"
      />

      <!-- 缓存状态显示 -->
      <div v-if="cacheStatus?.exists" class="cache-status">
        <el-tag :type="cacheStatus.isValid ? 'success' : 'warning'">
          {{ cacheStatus.isValid ? t('bop.cacheValid') : t('bop.cacheExpired') }}
        </el-tag>
        <span class="cache-info">
          {{ t('bop.cachedAt') }} {{ formatCacheDate(cacheStatus.timestamp) }}
        </span>
        <el-button
          v-if="!cacheStatus.isValid"
          type="primary"
          size="small"
          :loading="isRefreshing"
          @click="handleRefreshCache"
        >
          {{ t('bop.refreshCache') }}
        </el-button>
      </div>

      <el-form label-width="80px" class="import-form">
        <el-form-item :label="t('form.track')">
          <el-select
            v-model="importForm.track"
            :placeholder="t('common.pleaseSelect')"
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="track in tracks"
              :key="track"
              :label="formatTrackName(track)"
              :value="track"
            />
          </el-select>
        </el-form-item>

        <el-form-item :label="t('bop.carClass')">
          <el-select
            v-model="importForm.carClass"
            :placeholder="t('common.pleaseSelect')"
            filterable
            style="width: 100%"
          >
            <el-option :label="t('bop.allClasses')" value="all" />
            <el-option label="GT3" value="GT3" />
            <el-option label="GT4" value="GT4" />
            <el-option label="GT2" value="GT2" />
          </el-select>
        </el-form-item>
      </el-form>

      <!-- 加载状态 -->
      <div v-if="isLoading" class="loading-state">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>{{ loadingMessage }}</span>
      </div>

      <!-- 错误提示 -->
      <el-alert
        v-if="errorMessage"
        :title="t('common.error')"
        :description="errorMessage"
        type="error"
        show-icon
        closable
        @close="errorMessage = ''"
        class="error-alert"
      />

      <!-- 导入预览 -->
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
      <el-button @click="handleCancel">{{ t('common.cancel') }}</el-button>
      <el-button
        type="primary"
        :loading="isImporting"
        :disabled="isLoading || !previewData || previewData.entryCount === 0"
        @click="handleConfirmImport"
      >
        {{ t('common.confirm') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Loading } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
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
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'import-entries': [entries: BopEntry[]]
}>()

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const tracks = TRACKS
const defaultImportTrack = TRACKS[0] ?? 'monza'
const importForm = ref({
  track: defaultImportTrack,
  carClass: 'all' as CarClass | 'all'
})

const cacheStatus = ref<CacheStatus | null>(null)
const fullEntries = ref<BopEntry[]>([])
const isLoading = ref(false)
const isRefreshing = ref(false)
const isImporting = ref(false)
const loadingMessage = ref('')
const errorMessage = ref('')

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
  // 统一使用 getLfmBopStatus（在 Tauri 环境下自动调用 Rust 缓存命令）
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
    // Tauri 环境优先使用 Rust 缓存（fetchLfmBopCache 已处理环境判断）
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
    
    // 更新缓存状态
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
    // 统一使用 refreshLfmBopCache（在 Tauri 环境下自动调用 Rust 缓存刷新）
    await refreshLfmBopCache()
    await loadCacheStatus()
    await loadFullBopEntries()
    ElMessage.success(t('bop.cacheRefreshed'))
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
  importForm.value = { track: defaultImportTrack, carClass: 'all' }
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
  background: var(--el-fill-color-light);
  border-radius: 4px;
}

.cache-info {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px;
  color: var(--el-color-primary);
}

.error-alert {
  margin-top: 8px;
}

.import-preview {
  padding: 12px;
  background: var(--el-fill-color-lighter);
  border-radius: 4px;
}

.import-preview h5 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
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
  font-weight: 500;
  color: var(--el-text-color-secondary);
}

.stat-value {
  font-weight: 600;
}
</style>