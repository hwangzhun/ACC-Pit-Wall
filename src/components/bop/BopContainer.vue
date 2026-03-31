<template>
  <div class="bop-container">
    <!-- Header -->
    <div class="bop-header">
      <div class="header-title">
        <h3>{{ t('nav.bop') }}</h3>
        <span class="entry-count">{{ t('bop.total').replace('{count}', entries.length.toString()) }} {{ t('common.items') }}</span>
      </div>
      <div class="header-actions">
        <el-button
          type="danger"
          :icon="Delete"
          :disabled="selectedRows.length === 0"
          @click="handleBatchDelete"
        >
          {{ t('common.batchDelete') }}{{ selectedRows.length > 0 ? ` (${selectedRows.length})` : '' }}
        </el-button>
        <el-button type="success" :icon="Download" @click="showImportDialog = true">
          {{ t('bop.importFromLfm') }}
        </el-button>
        <el-button type="primary" :icon="Plus" @click="handleAddEntry">
          {{ t('title.addBop') }}
        </el-button>
      </div>
    </div>

    <!-- Main Content -->
    <div class="bop-content">
      <!-- Left: Data Table -->
      <div class="data-table-section">
        <BopDataTable
          ref="tableRef"
          :entries="filteredEntries"
          :selectedCount="selectedRows.length"
          v-model:searchKeyword="searchKeyword"
          @edit="handleEdit"
          @delete="handleDelete"
          @selectionChange="handleSelectionChange"
        />
      </div>

      <!-- Right: Edit Panel -->
      <div class="edit-panel-section">
        <BopEditPanel
          v-if="editingEntry"
          :entry="editingEntry"
          @save="handleSave"
          @cancel="handleCancelEdit"
        />
        <div v-else class="edit-placeholder">
          <el-icon :size="48" class="placeholder-icon"><Select /></el-icon>
          <p>{{ t('bop.clickToEdit') }}</p>
          <p class="placeholder-hint">{{ t('bop.orAddNew') }}</p>
        </div>
      </div>
    </div>

    <!-- Import Dialog -->
    <BopImportDialog
      v-model="showImportDialog"
      @import-entries="handleImportEntries"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Plus, Download, Delete, Select } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { Bop, BopEntry } from '../../types/configuration'
import BopDataTable from './BopDataTable.vue'
import BopEditPanel from './BopEditPanel.vue'
import BopImportDialog from './BopImportDialog.vue'
import { t } from '../../i18n'

const props = defineProps<{
  bop: Bop
}>()

const emit = defineEmits<{
  (e: 'update:bop', value: Bop): void
}>()

// 创建响应式的 bop ref
const bopRef = ref<Bop>(props.bop)

// 监听 props 变化
watch(() => props.bop, (newVal) => {
  bopRef.value = newVal
}, { deep: true })

// 监听 bopRef 变化，同步到父组件
watch(bopRef, (newVal) => {
  emit('update:bop', newVal)
}, { deep: true })

// ============ 状态管理 ============
const entries = computed({
  get: () => bopRef.value.entries,
  set: (val) => { bopRef.value.entries = val }
})

// 当前选中的行对象（由 el-table @selection-change 驱动）
const selectedRows = ref<BopEntry[]>([])
const tableRef = ref<InstanceType<typeof BopDataTable>>()
const editingEntry = ref<BopEntry | null>(null)
const editingIndex = ref<number | null>(null)
const searchKeyword = ref('')

// ============ 筛选逻辑 ============
const filteredEntries = computed(() => {
  let result = [...entries.value]
  const keyword = searchKeyword.value.toLowerCase().trim()
  if (keyword) {
    result = result.filter(entry => entry.track.toLowerCase().includes(keyword))
  }
  result.sort((a, b) => a.carModel - b.carModel)
  return result
})

// ============ 选择逻辑 ============
function handleSelectionChange(rows: BopEntry[]) {
  selectedRows.value = rows
}

function clearTableSelection() {
  tableRef.value?.clearSelection()
  selectedRows.value = []
}

// ============ CRUD 操作 ============
function handleAddEntry() {
  const newEntry: BopEntry = {
    track: 'monza',
    carModel: 0,
    ballastKg: 0,
    restrictor: 0
  }
  entries.value.push(newEntry)
  // 定位到新条目进行编辑
  editingEntry.value = newEntry
  editingIndex.value = entries.value.length - 1
  ElMessage.success(t('bop.entryAdded'))
}

async function handleDelete(filteredIndex: number) {
  // filteredIndex 是 filteredEntries 中的索引，需映射回 entries.value 的真实索引
  const entry = filteredEntries.value[filteredIndex]
  if (!entry) return
  const realIndex = entries.value.indexOf(entry)
  if (realIndex === -1) return

  try {
    await ElMessageBox.confirm(t('bop.confirmDelete'), t('common.confirm'), {
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      type: 'warning'
    })

    entries.value.splice(realIndex, 1)

    if (editingIndex.value === realIndex) {
      editingEntry.value = null
      editingIndex.value = null
    }

    // 已删除的行会从 selectedRows 中消失（el-table 自动处理），手动同步一次
    selectedRows.value = selectedRows.value.filter(r => r !== entry)

    ElMessage.success(t('bop.entryDeleted'))
  } catch {
    // 用户取消
  }
}

async function handleBatchDelete() {
  const count = selectedRows.value.length
  if (count === 0) return

  try {
    await ElMessageBox.confirm(
      t('bop.confirmBatchDelete').replace('{count}', count.toString()),
      t('common.batchDelete'),
      { confirmButtonText: t('common.confirm'), cancelButtonText: t('common.cancel'), type: 'warning' }
    )

    // 收集真实索引，从后往前删除避免索引偏移
    const indices = selectedRows.value
      .map(row => entries.value.indexOf(row))
      .filter(i => i !== -1)
      .sort((a, b) => b - a)

    indices.forEach(i => entries.value.splice(i, 1))

    clearTableSelection()
    editingEntry.value = null
    editingIndex.value = null

    ElMessage.success(t('bop.entriesDeleted').replace('{count}', count.toString()))
  } catch {
    // 用户取消
  }
}

function handleEdit(entry: BopEntry, filteredIndex: number) {
  // 找到在 entries.value 中的真实索引
  const realIndex = entries.value.indexOf(filteredEntries.value[filteredIndex] ?? entry)
  editingEntry.value = { ...entry }
  editingIndex.value = realIndex !== -1 ? realIndex : filteredIndex
}

function handleSave(updatedEntry: BopEntry) {
  if (editingIndex.value !== null) {
    entries.value[editingIndex.value] = { ...updatedEntry }
    ElMessage.success(t('bop.saveSuccess'))
  }
  editingEntry.value = null
  editingIndex.value = null
}

function handleCancelEdit() {
  editingEntry.value = null
  editingIndex.value = null
}

// ============ 导入 ============
const showImportDialog = ref(false)

function handleImportEntries(importedEntries: BopEntry[]) {
  entries.value.length = 0
  entries.value.push(...importedEntries)
  ElMessage.success(t('bop.importSuccess').replace('{count}', importedEntries.length.toString()))
  showImportDialog.value = false
  clearTableSelection()
  editingEntry.value = null
  editingIndex.value = null
}
</script>

<style scoped>
.bop-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--el-bg-color-page);
}

.bop-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-light);
  flex-shrink: 0;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-title h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.entry-count {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  padding: 2px 8px;
  border-radius: 10px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.bop-content {
  display: flex;
  flex: 1;
  overflow: hidden;
  min-height: 0;
}

.data-table-section {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color-page);
  min-width: 0;
  border-right: 1px solid var(--el-border-color-light);
}

.edit-panel-section {
  width: 350px;
  flex-shrink: 0;
  border-left: 1px solid var(--el-border-color-light);
  background: var(--el-bg-color);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.edit-placeholder {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  text-align: center;
  color: var(--el-text-color-secondary);
}

.placeholder-icon {
  margin-bottom: 16px;
  color: var(--el-text-color-placeholder);
}

.edit-placeholder p {
  margin: 4px 0;
  font-size: 14px;
}

.placeholder-hint {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

/* 响应式布局 */
@media (max-width: 1200px) {
  .edit-panel-section {
    width: 300px;
  }
}

@media (max-width: 992px) {
  .bop-content {
    flex-direction: column;
  }

  .data-table-section {
    border-right: none;
    border-bottom: 1px solid var(--el-border-color-light);
  }

  .edit-panel-section {
    width: 100%;
    height: auto;
    max-height: 400px;
    border-left: none;
    border-top: 1px solid var(--el-border-color-light);
  }
}
</style>
