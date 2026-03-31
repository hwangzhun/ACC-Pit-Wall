<template>
  <div class="bop-data-table">
    <!-- 表格工具栏 -->
    <div class="table-toolbar">
      <div class="toolbar-left">
        <span v-if="selectedCount > 0" class="selection-info">
          {{ t('common.selected').replace('{count}', selectedCount.toString()) }} {{ t('common.items') }}
        </span>
      </div>
      <div class="toolbar-right">
        <el-input
          :model-value="searchKeyword"
          @update:model-value="$emit('update:searchKeyword', $event)"
          :placeholder="t('placeholder.search')"
          clearable
          size="small"
          style="width: 200px"
          :prefix-icon="Search"
        />
      </div>
    </div>

    <!-- 数据表格 -->
    <el-table
      ref="tableRef"
      :data="entries"
      style="width: 100%"
      height="100%"
      highlight-current-row
      @row-click="handleRowClick"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="40" align="center" />

      <el-table-column :label="t('form.carModel')" min-width="200">
        <template #default="{ row }">
          <div class="car-cell">
            <el-image
              :src="getCarImageUrl(row.carModel)"
              class="car-thumbnail"
              fit="cover"
            >
              <template #error>
                <div class="image-placeholder">
                  <el-icon><Picture /></el-icon>
                </div>
              </template>
            </el-image>
            <div class="car-info">
              <span class="car-name">{{ getCarName(row.carModel) }}</span>
              <span class="car-class">{{ getCarClass(row.carModel) }}</span>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column :label="t('form.track')" width="120">
        <template #default="{ row }">
          <span class="track-name">{{ formatTrackName(row.track) }}</span>
        </template>
      </el-table-column>
      <el-table-column
        :label="t('form.ballastKg')"
        min-width="128"
        sortable
        label-class-name="bop-th-ballast"
      >
        <template #default="{ row }">
          <div class="ballast-cell">
            <span :class="['ballast-value', getBallastClass(row.ballastKg)]">
              {{ row.ballastKg > 0 ? `+${row.ballastKg}` : row.ballastKg }}
            </span>
            <el-progress
              :percentage="getBallastPercent(row.ballastKg)"
              :stroke-width="6"
              :color="getBallastColor(row.ballastKg)"
              :show-text="false"
            />
          </div>
        </template>
      </el-table-column>
      <el-table-column :label="t('bop.restrictor')" width="130" sortable>
        <template #default="{ row }">
          <div class="restrictor-cell">
            <span class="restrictor-value">{{ row.restrictor === 0 ? t('bop.noRestriction') : String(row.restrictor) }}</span>
            <el-progress
              :percentage="clampAccBopRestrictor(row.restrictor) * 5"
              :stroke-width="6"
              :color="getRestrictorColor(row.restrictor)"
              :show-text="false"
            />
          </div>
        </template>
      </el-table-column>
      <el-table-column :label="t('common.operation')" width="100" fixed="right">
        <template #default="{ row, $index }">
          <div class="action-buttons">
            <el-button type="primary" size="small" :icon="Edit" circle @click="handleEdit(row, $index)" />
            <el-button type="danger" size="small" :icon="Delete" circle @click="handleDelete($index)" />
          </div>
        </template>
      </el-table-column>
    </el-table>

    <!-- 表格底部统计 -->
    <div class="table-footer">
      <span class="footer-info">
        {{ entries.length }} {{ t('common.items') }}
        <template v-if="selectedCount > 0">
          , {{ t('common.selected').replace('{count}', selectedCount.toString()) }} {{ t('common.items') }}
        </template>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Search, Picture, Edit, Delete } from '@element-plus/icons-vue'
import type { BopEntry } from '../../types/configuration'
import { getCarImageUrl } from '../../data/mappings'
import { clampAccBopRestrictor } from '../../utils/lfmBopService'
import { useTrackName, getCarLocalizedName } from '../../i18n/mappings'
import { getCarClass } from './composables/useBopFilter'
import { t } from '../../i18n'
import type { ElTable } from 'element-plus'

const props = defineProps<{
  entries: BopEntry[]
  selectedCount: number
  searchKeyword: string
}>()

const emit = defineEmits<{
  (e: 'edit', entry: BopEntry, index: number): void
  (e: 'delete', index: number): void
  (e: 'selectionChange', rows: BopEntry[]): void
  (e: 'update:searchKeyword', value: string): void
}>()

const tableRef = ref<InstanceType<typeof ElTable>>()

// 选中行变化（el-table 原生事件）
function handleSelectionChange(rows: BopEntry[]) {
  emit('selectionChange', rows)
}

// 获取车型名称
function getCarName(carId: number): string {
  return getCarLocalizedName(carId)
}

// 格式化赛道名称
function formatTrackName(track: string): string {
  return useTrackName(track).value
}

// 配重样式
function getBallastClass(ballast: number): string {
  if (ballast > 0) return 'positive'
  if (ballast < 0) return 'negative'
  return 'zero'
}

// 配重进度条百分比
function getBallastPercent(ballast: number): number {
  return Math.abs(ballast)
}

// 配重颜色
function getBallastColor(ballast: number): string {
  if (ballast > 0) return '#f56c6c'
  if (ballast < 0) return '#67c23a'
  return '#909399'
}

// 进气限制器颜色（0–20，越大限制越强）
function getRestrictorColor(restrictor: number): string {
  const r = clampAccBopRestrictor(restrictor)
  if (r === 0) return '#67c23a'
  if (r <= 10) return '#e6a23c'
  return '#f56c6c'
}

// 处理行点击
function handleRowClick(row: BopEntry) {
  const index = props.entries.findIndex(e =>
    e.track === row.track && e.carModel === row.carModel
  )
  if (index !== -1) {
    emit('edit', row, index)
  }
}

// 处理编辑
function handleEdit(entry: BopEntry, index: number) {
  emit('edit', entry, index)
}

// 处理删除
function handleDelete(index: number) {
  emit('delete', index)
}

// 清空表格选择（供父组件调用）
function clearSelection() {
  tableRef.value?.clearSelection()
}

defineExpose({ clearSelection })
</script>

<style scoped>
.bop-data-table {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--el-bg-color);
}

.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--el-border-color-light);
  flex-shrink: 0;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.selection-info {
  font-size: 13px;
  color: var(--el-color-primary);
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 表格样式 */
:deep(.el-table) {
  flex: 1;
  overflow: auto;
}

:deep(.el-table__header) {
  background: var(--el-fill-color-light);
}

/* 配列表头：标题 + 排序箭头不换行 */
:deep(th.bop-th-ballast .cell) {
  white-space: nowrap;
}

:deep(.el-table__row) {
  cursor: pointer;
}

:deep(.el-table__row:hover) {
  background: var(--el-fill-color-light) !important;
}

:deep(.el-table__row.current-row) {
  background: var(--el-color-primary-light-9) !important;
}

/* 车型单元格 */
.car-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.car-thumbnail {
  width: 60px;
  height: 36px;
  border-radius: 4px;
  flex-shrink: 0;
  background: var(--el-fill-color-light);
}

.image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-placeholder);
  font-size: 16px;
}

.car-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.car-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.car-class-tag {
  width: fit-content;
  font-size: 11px;
  height: 18px;
  padding: 0 6px;
}

/* 赛道文字 */
.track-text {
  font-size: 13px;
  color: var(--el-text-color-regular);
}

/* 数值单元格 */
.value-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ballast-value {
  font-size: 13px;
  font-weight: 500;
}

.ballast-value.positive {
  color: #f56c6c;
}

.ballast-value.negative {
  color: #67c23a;
}

.ballast-value.zero {
  color: var(--el-text-color-secondary);
}

.restrictor-value {
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.value-progress {
  width: 60px;
}

.value-progress :deep(.el-progress-bar__outer) {
  border-radius: 2px;
}

.value-progress :deep(.el-progress-bar__inner) {
  border-radius: 2px;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 4px;
}

.action-buttons .el-button {
  padding: 6px;
}

/* 表格底部 */
.table-footer {
  padding: 12px 16px;
  border-top: 1px solid var(--el-border-color-light);
  background: var(--el-fill-color-light);
  flex-shrink: 0;
}

.footer-info {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
</style>
