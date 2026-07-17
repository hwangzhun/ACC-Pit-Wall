<template>
  <div class="bop-data-table">
    <Win11Table
      :data="entries"
      :columns="columns"
      :show-selection="true"
      :show-footer="true"
      height="100%"
      :selected="selectedRows"
      @selection-change="handleSelectionChange"
      @row-click="handleRowClick"
    >
      <template #cell-carModel="{ row }">
        <div class="car-cell">
          <Win11Image
            :src="getCarImageUrl(row.carModel)"
            class="car-thumbnail"
            width="44"
            height="26"
            fit="cover"
          >
            <template #error>
              <div class="image-placeholder">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </template>
          </Win11Image>
          <div class="car-info">
            <span class="car-name">{{ getCarName(row.carModel) }}</span>
            <span class="car-class">{{ getCarClass(row.carModel) }}</span>
          </div>
        </div>
      </template>

      <template #cell-track="{ row }">
        <span class="track-name">{{ formatTrackName(row.track) }}</span>
      </template>

      <template #cell-ballastKg="{ row }">
        <div class="ballast-cell">
          <span :class="['ballast-value', getBallastClass(row.ballastKg)]">
            {{ row.ballastKg > 0 ? `+${row.ballastKg}` : row.ballastKg }}
          </span>
          <Win11Progress
            :percentage="getBallastPercent(row.ballastKg)"
            :stroke-width="6"
            :color="getBallastColor(row.ballastKg)"
          />
        </div>
      </template>

      <template #cell-restrictor="{ row }">
        <div class="restrictor-cell">
          <span class="restrictor-value">{{ row.restrictor === 0 ? t('bop.noRestriction') : String(row.restrictor) }}</span>
          <Win11Progress
            :percentage="clampAccBopRestrictor(row.restrictor) * 5"
            :stroke-width="6"
            :color="getRestrictorColor(row.restrictor)"
          />
        </div>
      </template>

      <template #cell-actions="{ row }">
        <div class="action-buttons">
          <Win11Button
            variant="primary"
            size="small"
            circle
            @click.stop="handleEdit(row as BopEntry)"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </Win11Button>
          <Win11Button
            variant="danger"
            size="small"
            circle
            @click.stop="handleDelete(row as BopEntry)"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </Win11Button>
        </div>
      </template>
    </Win11Table>

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
import type { BopEntry } from '../../types/configuration'
import { getCarImageUrl } from '../../data/mappings'
import { clampAccBopRestrictor } from '../../utils/lfmBopService'
import { useTrackName, getCarLocalizedName } from '../../i18n/mappings'
import { getCarClass } from './utils'
import { t } from '../../i18n'
import {
  Win11Table,
  Win11Image,
  Win11Progress,
  Win11Button
} from '../win11'

defineProps<{
  entries: BopEntry[]
  selectedCount: number
}>()

const emit = defineEmits<{
  (e: 'edit', entry: BopEntry): void
  (e: 'delete', entry: BopEntry): void
  (e: 'selectionChange', rows: BopEntry[]): void
}>()

const selectedRows = ref<Record<string, any>[]>([])

const columns = [
  { key: 'carModel', label: t('form.carModel'), width: '34%' },
  { key: 'track', label: t('form.track'), width: '20%' },
  { key: 'ballastKg', label: t('form.ballastKg'), width: '18%', sortable: true },
  { key: 'restrictor', label: t('bop.restrictor'), width: '18%', sortable: true },
  { key: 'actions', label: t('common.operation'), width: '10%' }
]

function handleSelectionChange(rows: Record<string, any>[]) {
  selectedRows.value = rows
  emit('selectionChange', rows as BopEntry[])
}

function getCarName(carId: number): string {
  return getCarLocalizedName(carId)
}

function formatTrackName(track: string): string {
  return useTrackName(track).value
}

function getBallastClass(ballast: number): string {
  if (ballast > 0) return 'positive'
  if (ballast < 0) return 'negative'
  return 'zero'
}

function getBallastPercent(ballast: number): number {
  return Math.abs(ballast)
}

function getBallastColor(ballast: number): string {
  if (ballast > 0) return '#f56c6c'
  if (ballast < 0) return '#67c23a'
  return '#909399'
}

function getRestrictorColor(restrictor: number): string {
  const r = clampAccBopRestrictor(restrictor)
  if (r === 0) return '#67c23a'
  if (r <= 10) return '#e6a23c'
  return '#f56c6c'
}

function handleRowClick(row: Record<string, any>) {
  emit('edit', row as BopEntry)
}

function handleEdit(entry: BopEntry) {
  emit('edit', entry)
}

function handleDelete(entry: BopEntry) {
  emit('delete', entry)
}

defineExpose({ clearSelection: () => { selectedRows.value = [] } })
</script>

<style scoped>
.bop-data-table {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--win11-surface);
}

.bop-data-table :deep(.win11-table-row .win11-table-cell) {
  display: flex;
  align-items: center;
}

.bop-data-table :deep(.win11-table-row .win11-table-cell:nth-child(3)),
.bop-data-table :deep(.win11-table-row .win11-table-cell:nth-child(4)),
.bop-data-table :deep(.win11-table-row .win11-table-cell:nth-child(5)),
.bop-data-table :deep(.win11-table-row .win11-table-cell:nth-child(6)) {
  justify-content: center;
}

.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--win11-border);
  flex-shrink: 0;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.selection-info {
  font-size: var(--type-body);
  color: var(--win11-accent);
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.table-footer {
  padding: 12px 16px;
  border-top: 1px solid var(--win11-border);
  background: var(--win11-control-bg);
  flex-shrink: 0;
}

.footer-info {
  font-size: var(--type-body);
  color: var(--win11-text-secondary);
}

.car-cell {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  width: 100%;
}

.car-thumbnail {
  border-radius: 4px;
  flex-shrink: 0;
  background: var(--win11-control-bg);
  width: 44px;
  min-width: 44px;
  height: 26px;
  overflow: hidden;
}

.image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--win11-control-bg);
  color: var(--win11-text-secondary);
}

.car-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.car-name {
  font-size: var(--type-body);
  font-weight: var(--weight-emphasis);
  color: var(--win11-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.car-class {
  font-size: var(--type-caption);
  color: var(--win11-text-secondary);
}

.track-name {
  font-size: var(--type-body);
  color: var(--win11-text);
}

.ballast-cell,
.restrictor-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  width: 100%;
  max-width: 100%;
  align-items: stretch;
}

.ballast-value {
  font-size: var(--type-body);
  font-weight: var(--weight-emphasis);
}

.ballast-value.positive {
  color: rgb(var(--win11-ballast-positive-rgb));
}

.ballast-value.negative {
  color: rgb(var(--win11-ballast-negative-rgb));
}

.ballast-value.zero {
  color: var(--win11-text-secondary);
}

.restrictor-value {
  font-size: var(--type-body);
  font-weight: var(--weight-emphasis);
  color: var(--win11-text);
}

.action-buttons {
  display: flex;
  gap: 4px;
}
</style>
