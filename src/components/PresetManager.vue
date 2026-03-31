<template>
  <div>
    <el-button type="primary" :icon="Folder" @click="dialogVisible = true">
      {{ t('preset.title') }}
    </el-button>

    <el-dialog
      v-model="dialogVisible"
      :title="t('preset.title')"
      width="820px"
      :close-on-click-modal="false"
      @opened="loadPresets"
    >
      <div class="preset-manager">
        <div class="preset-list">
          <div class="preset-list-header">
            <el-input
              v-model="searchQuery"
              :placeholder="t('preset.searchPlaceholder')"
              :prefix-icon="Search"
              clearable
              size="small"
            />
          </div>
          <el-scrollbar class="preset-list-content">
            <div
              v-for="preset in filteredPresets"
              :key="preset.name"
              class="preset-item"
              :class="{
                active: selectedPreset?.name === preset.name,
                'in-use': activePresetName && preset.name === activePresetName
              }"
              @click="selectPreset(preset)"
            >
              <div class="preset-item-name-row">
                <span class="preset-item-name">{{ preset.name }}</span>
                <el-tag v-if="activePresetName === preset.name" size="small" type="success" effect="plain">
                  {{ t('preset.inUse') }}
                </el-tag>
              </div>
              <div class="preset-item-tags">
                <el-tag size="small" type="primary" effect="plain">
                  {{ trackLabel(preset.track) }}
                </el-tag>
                <el-tag size="small" type="success" effect="plain">
                  {{ carGroupLabel(preset.carGroup) }}
                </el-tag>
              </div>
              <div class="preset-item-date">
                {{ formatDate(preset.updatedAt) }}
              </div>
            </div>
          </el-scrollbar>
        </div>

        <div class="preset-detail">
          <div v-if="selectedPreset" class="preset-info">
            <h4>{{ selectedPreset.name }}</h4>
            <div class="preset-info-highlight">
              <span class="preset-highlight-label">{{ t('form.track') }}</span>
              <el-tag type="primary" effect="light">{{ trackLabel(selectedPreset.track) }}</el-tag>
              <span class="preset-highlight-label">{{ t('form.carGroup') }}</span>
              <el-tag type="success" effect="light">{{ carGroupLabel(selectedPreset.carGroup) }}</el-tag>
            </div>
            <p v-if="selectedPreset.description" class="preset-description">
              {{ selectedPreset.description }}
            </p>
            <div class="preset-meta">
              <div>{{ t('preset.createdAt') }}: {{ formatDateTime(selectedPreset.createdAt) }}</div>
              <div>{{ t('preset.updatedAt') }}: {{ formatDateTime(selectedPreset.updatedAt) }}</div>
            </div>
          </div>
          <el-empty v-else :description="t('preset.emptySelect')" />

          <div class="preset-actions preset-actions-primary">
            <el-button type="primary" size="large" :icon="Plus" @click="showSaveDialog">
              {{ t('preset.saveCurrent') }}
            </el-button>
            <el-button
              type="success"
              size="large"
              :icon="FolderOpened"
              :disabled="!selectedPreset"
              @click="handleLoad"
            >
              {{ t('preset.loadSelected') }}
            </el-button>
          </div>
          <div class="preset-actions preset-actions-update">
            <el-button
              type="warning"
              :icon="Refresh"
              :disabled="!selectedPreset"
              @click="handleUpdatePreset"
            >
              {{ t('preset.updateSelected') }}
            </el-button>
            <span class="update-hint">{{ t('preset.updateHint') }}</span>
          </div>

          <div class="preset-actions preset-actions-secondary">
            <el-button :icon="Edit" :disabled="!selectedPreset" @click="showRenameDialog">
              {{ t('preset.renameAction') }}
            </el-button>
            <el-button type="danger" plain :icon="Delete" :disabled="!selectedPreset" @click="handleDelete">
              {{ t('common.delete') }}
            </el-button>
          </div>
        </div>
      </div>
    </el-dialog>

    <el-dialog v-model="saveDialogVisible" :title="t('preset.saveDialogTitle')" width="520px">
      <div class="save-context">
        <div class="save-context-title">{{ t('preset.saveContextTitle') }}</div>
        <div class="save-context-row">
          <span class="save-context-label">{{ t('form.track') }}</span>
          <el-tag type="primary">{{ currentTrackDisplay }}</el-tag>
        </div>
        <div class="save-context-row">
          <span class="save-context-label">{{ t('form.carGroup') }}</span>
          <el-tag type="success">{{ currentCarGroupDisplay }}</el-tag>
        </div>
      </div>
      <el-form :model="saveForm" :label-width="labelWidth" class="save-form">
        <el-form-item :label="t('preset.presetName')" required>
          <el-input v-model="saveForm.name" :placeholder="t('preset.placeholderName')" />
        </el-form-item>
        <el-form-item :label="t('preset.description')">
          <el-input
            v-model="saveForm.description"
            type="textarea"
            :rows="3"
            :placeholder="t('preset.placeholderDescription')"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="saveDialogVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleSave">{{ t('common.save') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="renameDialogVisible" :title="t('preset.renameDialogTitle')" width="500px">
      <el-form :model="renameForm" :label-width="labelWidth">
        <el-form-item :label="t('preset.newName')" required>
          <el-input v-model="renameForm.name" :placeholder="t('preset.placeholderNewName')" />
        </el-form-item>
        <el-form-item :label="t('preset.description')">
          <el-input
            v-model="renameForm.description"
            type="textarea"
            :rows="3"
            :placeholder="t('preset.placeholderDescriptionEdit')"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="renameDialogVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleRename">{{ t('common.confirm') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, withDefaults } from 'vue'
import { Folder, Search, Plus, FolderOpened, Edit, Delete, Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { AllConfigs } from '../types/configuration'
import { formatTrackName } from '../types/defaults'
import { getCurrentLanguage, t, currentLanguage } from '../i18n'
import {
  getPresets,
  savePreset,
  loadPreset,
  updatePreset,
  renamePreset,
  deletePreset,
  type Preset
} from '../utils/presetManager'

const props = withDefaults(
  defineProps<{
    configs: AllConfigs
    activePresetName?: string | null
  }>(),
  { activePresetName: null }
)

const emit = defineEmits<{
  load: [payload: { configs: AllConfigs; presetName: string }]
  activePresetChange: [name: string | null]
}>()

const labelWidth = computed(() => (getCurrentLanguage() === 'zh' ? '80px' : '100px'))

function trackLabel(track?: string): string {
  const id = (track || '').trim()
  if (!id) return t('preset.unset')
  return formatTrackName(id, getCurrentLanguage())
}

function trackSearchBlob(track?: string): string {
  const id = (track || '').trim()
  if (!id) return ''
  return `${id} ${formatTrackName(id, 'zh')} ${formatTrackName(id, 'en')}`.toLowerCase()
}

function carGroupLabel(group?: string): string {
  const g = (group || '').trim()
  return g || t('preset.unset')
}

const dialogVisible = ref(false)
const saveDialogVisible = ref(false)
const renameDialogVisible = ref(false)

const presets = ref<Preset[]>([])
const selectedPreset = ref<Preset | null>(null)
const searchQuery = ref('')

const saveForm = ref({
  name: '',
  description: ''
})

const renameForm = ref({
  name: '',
  description: ''
})

const currentTrackDisplay = computed(() => {
  void currentLanguage.value
  const track = (props.configs?.event?.track || '').trim()
  return track ? formatTrackName(track, getCurrentLanguage()) : t('preset.unset')
})

const currentCarGroupDisplay = computed(() => {
  void currentLanguage.value
  const g = (props.configs?.settings?.carGroup || '').trim()
  return g || t('preset.unset')
})

const filteredPresets = computed(() => {
  void currentLanguage.value
  const list = presets.value
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return list
  return list.filter(p => {
    const group = carGroupLabel(p.carGroup).toLowerCase()
    return (
      p.name.toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q) ||
      trackSearchBlob(p.track).includes(q) ||
      group.includes(q)
    )
  })
})

function dateLocale(): string {
  return getCurrentLanguage() === 'zh' ? 'zh-CN' : 'en-US'
}

function formatDate(dateStr: string): string {
  void currentLanguage.value
  const date = new Date(dateStr)
  return date.toLocaleDateString(dateLocale())
}

function formatDateTime(dateStr: string): string {
  void currentLanguage.value
  const date = new Date(dateStr)
  return date.toLocaleString(dateLocale())
}

async function loadPresets() {
  try {
    presets.value = await getPresets()
  } catch (error) {
    ElMessage.error(`${t('preset.errLoadList')}: ${(error as Error).message}`)
  }
}

function selectPreset(preset: Preset) {
  selectedPreset.value = preset
}

function showSaveDialog() {
  saveForm.value.name = ''
  saveForm.value.description = ''
  saveDialogVisible.value = true
}

async function handleSave() {
  if (!saveForm.value.name.trim()) {
    ElMessage.warning(t('preset.warnNameRequired'))
    return
  }

  try {
    await savePreset(saveForm.value.name.trim(), saveForm.value.description, props.configs)
    ElMessage.success(t('preset.successSaved'))
    saveDialogVisible.value = false
    await loadPresets()
  } catch (error) {
    ElMessage.error(`${t('preset.errSave')}: ${(error as Error).message}`)
  }
}

async function handleLoad() {
  if (!selectedPreset.value) return

  try {
    const data = await loadPreset(selectedPreset.value.name)
    const presetName = selectedPreset.value.name
    emit('load', { configs: data.configs, presetName })
    ElMessage.success(t('preset.successLoaded'))
    dialogVisible.value = false
  } catch (error) {
    ElMessage.error(`${t('preset.errLoad')}: ${(error as Error).message}`)
  }
}

function showRenameDialog() {
  if (!selectedPreset.value) return

  renameForm.value.name = selectedPreset.value.name
  renameForm.value.description = selectedPreset.value.description || ''
  renameDialogVisible.value = true
}

async function handleRename() {
  if (!renameForm.value.name.trim()) {
    ElMessage.warning(t('preset.warnNewNameRequired'))
    return
  }

  const oldName = selectedPreset.value!.name
  const newName = renameForm.value.name.trim()

  try {
    await renamePreset(oldName, newName, renameForm.value.description)
    ElMessage.success(t('preset.successRenamed'))
    renameDialogVisible.value = false
    if (props.activePresetName === oldName) {
      emit('activePresetChange', newName)
    }
    selectedPreset.value = null
    await loadPresets()
  } catch (error) {
    ElMessage.error(`${t('preset.errRename')}: ${(error as Error).message}`)
  }
}

async function handleUpdatePreset() {
  if (!selectedPreset.value) return

  const name = selectedPreset.value.name

  try {
    await ElMessageBox.confirm(
      t('preset.confirmUpdate').replace('{name}', name),
      t('preset.updateDialogTitle'),
      {
        confirmButtonText: t('common.update'),
        cancelButtonText: t('common.cancel'),
        type: 'warning'
      }
    )

    await updatePreset(name, props.configs)
    ElMessage.success(t('preset.successUpdated'))
    await loadPresets()
    const found = presets.value.find(p => p.name === name)
    selectedPreset.value = found ?? null
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(`${t('preset.errUpdate')}: ${(error as Error).message}`)
    }
  }
}

async function handleDelete() {
  if (!selectedPreset.value) return

  const name = selectedPreset.value.name

  try {
    await ElMessageBox.confirm(
      t('preset.confirmDelete').replace('{name}', name),
      t('preset.deleteDialogTitle'),
      {
        confirmButtonText: t('common.delete'),
        cancelButtonText: t('common.cancel'),
        type: 'warning'
      }
    )

    await deletePreset(name)
    ElMessage.success(t('preset.successDeleted'))
    if (props.activePresetName === name) {
      emit('activePresetChange', null)
    }
    selectedPreset.value = null
    await loadPresets()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(`${t('preset.errDelete')}: ${(error as Error).message}`)
    }
  }
}

onMounted(() => {
  loadPresets()
})
</script>

<style scoped>
.preset-manager {
  display: flex;
  height: 500px;
  gap: 20px;
}

.preset-list {
  width: 300px;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e4e7ed;
  padding-right: 15px;
}

.preset-list-header {
  padding-bottom: 15px;
  border-bottom: 1px solid #e4e7ed;
  margin-bottom: 10px;
}

.preset-list-content {
  flex: 1;
}

.preset-item {
  padding: 12px 10px;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s;
  margin-bottom: 4px;
}

.preset-item:hover {
  background-color: #f5f7fa;
}

.preset-item.active {
  background-color: #ecf5ff;
  border-left: 3px solid #409eff;
}

.preset-item.in-use:not(.active) {
  border-left: 3px solid #67c23a;
}

.preset-item-name-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 6px;
}

.preset-item-name {
  font-weight: 500;
  color: #303133;
}

.preset-item-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 6px;
}

.preset-item-date {
  font-size: 12px;
  color: #909399;
}

.preset-detail {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding-left: 10px;
  min-width: 0;
}

.preset-info {
  flex: 1;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 16px;
}

.preset-info h4 {
  margin: 0 0 12px 0;
  color: #303133;
  font-size: 18px;
}

.preset-info-highlight {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  margin-bottom: 12px;
}

.preset-highlight-label {
  font-size: 12px;
  color: #909399;
}

.preset-description {
  color: #606266;
  font-size: 14px;
  margin-bottom: 15px;
  line-height: 1.5;
}

.preset-meta {
  font-size: 12px;
  color: #909399;
  line-height: 1.8;
}

.preset-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.preset-actions .el-button {
  margin: 0;
}

.preset-actions-primary {
  margin-bottom: 12px;
}

.preset-actions-primary .el-button {
  flex: 1;
  min-width: 140px;
}

.preset-actions-update {
  align-items: center;
  margin-bottom: 12px;
  gap: 12px;
}

.update-hint {
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
  flex: 1;
  min-width: 160px;
}

.preset-actions-secondary {
  padding-top: 4px;
  border-top: 1px solid #ebeef5;
}

.save-context {
  padding: 12px 14px;
  margin-bottom: 16px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
}

.save-context-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 10px;
}

.save-context-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.save-context-row:last-child {
  margin-bottom: 0;
}

.save-context-label {
  width: 72px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  flex-shrink: 0;
}

.save-form {
  margin-top: 4px;
}
</style>
