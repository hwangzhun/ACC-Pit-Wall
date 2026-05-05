<template>
  <div class="entry-table-view">
    <div v-if="selectedRows.length > 0" class="batch-action-bar">
      <span class="batch-info">
        {{ t('common.selected').replace('{count}', selectedRows.length.toString()) }}
      </span>
      <Win11Button variant="danger" size="small" @click="emit('batch-delete')">
        {{ t('common.deleteCount').replace('{count}', selectedRows.length.toString()) }}
      </Win11Button>
      <Win11Button variant="secondary" size="small" @click="selectedRows = []">
        {{ t('common.cancel') }}
      </Win11Button>
    </div>
    <Win11Table
      :data="entries"
      :columns="columns"
      :row-key="(row: Entry) => `${row.teamName}-${row.raceNumber}-${row.defaultGridPosition}`"
      show-selection
      v-model:selected="selectedRows"
      height="calc(100vh - 400px)"
    >
      <!-- 车号列 -->
      <template #cell-raceNumber="{ row }">
        <span class="race-number-cell">#{{ row.raceNumber }}</span>
      </template>

      <!-- 车队名列 -->
      <template #cell-teamName="{ row }">
        <div class="team-name-text">{{ row.teamName || t('common.unnamedTeam') }}</div>
      </template>

      <!-- 车型列 -->
      <template #cell-carModel="{ row }">
        <span v-if="row.forcedCarModel > -1" class="car-model-text">
          {{ getCarLocalizedName(row.forcedCarModel) }}
        </span>
        <span v-else class="car-model-text text-win11-text-secondary">—</span>
      </template>

      <!-- 车手数列 -->
      <template #cell-driverCount="{ row }">
        <span class="driver-count-cell">{{ row.drivers.length }}</span>
      </template>

      <!-- 主要车手列 -->
      <template #cell-primaryDriver="{ row }">
        <div class="primary-driver-cell">
          <div
            v-for="(driver, idx) in row.drivers.slice(0, 2)"
            :key="idx"
            class="driver-chip"
            :class="{ 'has-issue': !isDriverHealthy(asEntry(row), idx) }"
          >
            <span :class="['category-dot', `cat-${driver.driverCategory}`]" />
            <span class="driver-name">{{ driver.firstName }} {{ driver.lastName }}</span>
          </div>
          <span v-if="row.drivers.length > 2" class="more-drivers">
            +{{ row.drivers.length - 2 }}
          </span>
        </div>
      </template>

      <!-- 状态列 -->
      <template #cell-healthStatus="{ row }">
        <div class="health-status-cell">
          <span v-if="entryHealthIssues(asEntry(row)).length === 0" class="status-ok">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </span>
          <span v-else class="status-warning" :title="entryHealthIssues(asEntry(row)).join(', ')">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {{ entryHealthIssues(asEntry(row)).length }}
          </span>
        </div>
      </template>

      <!-- 操作列 -->
      <template #cell-actions="{ row }">
        <div class="actions-cell">
          <button class="win11-icon-btn" @click.stop="$emit('edit', asEntry(row))" :title="t('common.edit')">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button class="win11-icon-btn danger" @click.stop="$emit('delete', asEntry(row))" :title="t('common.delete')">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </template>

      <!-- 空状态 -->
      <template #empty>
        <div class="win11-empty-state">
          <svg class="w-16 h-16 text-win11-text-secondary mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p class="text-win11-text-secondary mb-4">{{ t('common.noEntryList') }}</p>
        </div>
      </template>
    </Win11Table>
  </div>
</template>

<script setup lang="ts">
import type { Entry } from '../../types/configuration'
import { t } from '../../i18n'
import { isValidSteamId } from '../../utils/steamId'
import { Win11Table, Win11Button } from '../win11'
import { getCarLocalizedName } from '../../i18n/mappings'

const { entries } = defineProps<{
  entries: Entry[]
}>()

const emit = defineEmits<{
  'edit': [entry: Entry]
  'delete': [entry: Entry]
  'batch-delete': []
}>()

const selectedRows = defineModel<Entry[]>('selected', { default: () => [] })

const columns = [
  { key: 'raceNumber', label: t('form.raceNumber'), width: '80px', sortable: true },
  { key: 'teamName', label: t('form.teamName'), minWidth: '180px', sortable: true },
  { key: 'carModel', label: t('form.carModel') || 'Car Model', minWidth: '200px', sortable: true },
  { key: 'driverCount', label: t('common.drivers'), width: '80px', sortable: true },
  { key: 'primaryDriver', label: t('common.primaryDriver') || 'Primary Driver', minWidth: '200px' },
  { key: 'healthStatus', label: t('common.status') || 'Status', width: '100px' },
  { key: 'actions', label: t('common.operation'), width: '100px' }
]

function entryHealthIssues(entry: Entry): string[] {
  const issues: string[] = []
  if (!entry.teamName?.trim()) issues.push('teamName-empty')
  if (entry.raceNumber <= 0) issues.push('raceNumber-zero')
  if (entry.drivers.length === 0) issues.push('no-drivers')
  entry.drivers.forEach((d, i) => {
    if (!d.lastName?.trim()) issues.push(`driver-${i}-empty-name`)
    if (d.playerID && !isValidSteamId(d.playerID)) issues.push(`driver-${i}-invalid-steamid`)
  })
  return issues
}

function asEntry(row: Record<string, any>): Entry {
  return row as Entry
}

function isDriverHealthy(entry: Entry, index: number): boolean {
  return !entryHealthIssues(entry).some(i => i.startsWith(`driver-${index}`))
}

</script>

<style scoped>
.entry-table-view {
  @apply w-full;
}

.batch-action-bar {
  @apply flex items-center gap-3 px-3 py-2 mb-2 rounded-md;
  @apply bg-win11-accent/10 border border-win11-accent/20;
}

.batch-info {
  @apply text-sm text-win11-text font-medium flex-1;
}

.race-number-cell {
  @apply font-mono font-bold text-win11-accent;
}

.team-name-text {
  @apply font-semibold text-win11-text truncate block;
  @apply max-w-full;
}

.car-model-text {
  @apply text-sm text-win11-text truncate block max-w-full;
}

.driver-count-cell {
  @apply text-center font-mono;
}

.primary-driver-cell {
  @apply flex flex-nowrap items-center gap-1 min-w-0 overflow-hidden;
}

.driver-chip {
  @apply flex items-center gap-1 px-2 py-0.5 rounded text-xs;
  @apply bg-win11-control-bg text-win11-text;
}

.driver-chip.has-issue {
  @apply border border-amber-500/30 bg-amber-500/5;
}

.category-dot {
  @apply w-2 h-2 rounded-full;
}

.category-dot.cat-0 { @apply bg-yellow-400; }
.category-dot.cat-1 { @apply bg-yellow-300; }
.category-dot.cat-2 { @apply bg-gray-400; }
.category-dot.cat-3 { @apply bg-amber-500; }

.driver-name {
  @apply text-xs;
}

.more-drivers {
  @apply text-xs text-win11-text-secondary px-1;
}

.health-status-cell {
  @apply flex items-center;
}

.status-ok {
  @apply text-emerald-500;
}

.status-warning {
  @apply flex items-center gap-1 text-amber-500 text-xs;
}

.actions-cell {
  @apply flex items-center gap-1;
}

.win11-icon-btn {
  @apply w-8 h-8 rounded-md flex items-center justify-center;
  @apply text-win11-icon hover:text-win11-text hover:bg-win11-surface-hover;
  @apply transition-all duration-200;
}

.win11-icon-btn.danger {
  @apply text-win11-icon hover:text-red-500 hover:bg-red-500/10;
}

.win11-empty-state {
  @apply flex flex-col items-center justify-center py-12;
  @apply text-center;
}
</style>