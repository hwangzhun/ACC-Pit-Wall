<template>
  <div class="win11-table-wrapper">
    <div class="win11-table" :style="{ height: height }">
      <div class="win11-table-header">
        <div class="win11-table-row win11-table-row--header">
          <div v-if="showSelection" class="win11-table-cell win11-table-cell--selection">
            <input
              type="checkbox"
              :checked="isAllSelected"
              :indeterminate="isIndeterminate"
              @change="toggleSelectAll"
              class="win11-checkbox"
            />
          </div>
          <div
            v-for="column in columns"
            :key="column.key"
            class="win11-table-cell"
            :class="{ 'is-sortable': column.sortable }"
            :style="cellStyle(column)"
            @click="() => column.sortable && handleSort(column.key)"
          >
            <slot :name="`header-${column.key}`">
              {{ column.label }}
            </slot>
            <span v-if="column.sortable && sortKey === column.key" class="sort-indicator">
              {{ sortOrder === 'asc' ? '↑' : '↓' }}
            </span>
          </div>
        </div>
      </div>
      <div class="win11-table-body">
        <div
          v-for="(row, rowIndex) in sortedData"
          :key="getRowKey(row, rowIndex)"
          class="win11-table-row"
          :class="{
            'is-selected': isSelected(row),
            'is-current': currentRowIndex === rowIndex
          }"
          @click="handleRowClick(row, rowIndex)"
        >
          <div v-if="showSelection" class="win11-table-cell win11-table-cell--selection">
            <input
              type="checkbox"
              :checked="isSelected(row)"
              @change="() => toggleSelect(row)"
              @click.stop
              class="win11-checkbox"
            />
          </div>
          <div
            v-for="column in columns"
            :key="column.key"
            class="win11-table-cell"
            :style="cellStyle(column)"
          >
            <slot :name="`cell-${column.key}`" :row="row" :column="column" :$index="rowIndex">
              {{ getCellValue(row, column.key) }}
            </slot>
          </div>
        </div>
        <div v-if="data.length === 0" class="win11-table-empty">
          <slot name="empty">{{ t('common.noData') }}</slot>
        </div>
      </div>
    </div>
    <div v-if="showFooter" class="win11-table-footer">
      <slot name="footer">
        {{ data.length }} {{ t('common.items') }}
        <template v-if="selected.length > 0">
          , {{ t('common.selected').replace('{count}', selected.length.toString()) }} {{ t('common.items') }}
        </template>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { t } from '../../i18n'

interface Column {
  key: string
  label?: string
  width?: string
  minWidth?: string
  sortable?: boolean
}

const props = withDefaults(defineProps<{
  data: Record<string, any>[]
  columns: Column[]
  rowKey?: string | ((row: Record<string, any>) => string | number)
  showSelection?: boolean
  showFooter?: boolean
  height?: string
  highlightCurrentRow?: boolean
}>(), {
  showSelection: false,
  showFooter: true,
  height: '100%',
  highlightCurrentRow: false
})

const emit = defineEmits<{
  'selectionChange': [rows: Record<string, any>[]]
  'rowClick': [row: Record<string, any>, index: number]
  'sortChange': [key: string, order: 'asc' | 'desc']
}>()

const selected = defineModel<Record<string, any>[]>('selected', { default: () => [] })
const sortKey = ref<string | null>(null)
const sortOrder = ref<'asc' | 'desc'>('asc')
const currentRowIndex = ref<number | null>(null)

function cellStyle(column: Column): Record<string, string> {
  if (column.width) {
    return { flex: `0 0 ${column.width}`, width: column.width, minWidth: column.width }
  }
  if (column.minWidth) {
    return { flex: '1 1 0', minWidth: column.minWidth }
  }
  return { flex: '1 1 auto' }
}

const isAllSelected = computed(() => {
  return props.data.length > 0 && props.data.every(row => isSelected(row))
})

const isIndeterminate = computed(() => {
  return selected.value.length > 0 && !isAllSelected.value
})

const sortedData = computed(() => {
  if (!sortKey.value) return props.data
  
  return [...props.data].sort((a, b) => {
    const aVal = a[sortKey.value!]
    const bVal = b[sortKey.value!]
    
    if (aVal === bVal) return 0
    if (aVal == null) return 1
    if (bVal == null) return -1
    
    const comparison = aVal < bVal ? -1 : 1
    return sortOrder.value === 'asc' ? comparison : -comparison
  })
})

function getRowKey(row: Record<string, any>, index: number): string | number {
  if (typeof props.rowKey === 'function') {
    return props.rowKey(row)
  }
  if (props.rowKey && row[props.rowKey] !== undefined) {
    return row[props.rowKey]
  }
  return index
}

function getCellValue(row: Record<string, any>, key: string): any {
  return row[key]
}

function isSelected(row: Record<string, any>): boolean {
  const key = props.rowKey ? (typeof props.rowKey === 'function' ? props.rowKey(row) : row[props.rowKey]) : JSON.stringify(row)
  return selected.value.some(s => {
    const sKey = props.rowKey ? (typeof props.rowKey === 'function' ? props.rowKey(s) : s[props.rowKey]) : JSON.stringify(s)
    return sKey === key
  })
}

function toggleSelect(row: Record<string, any>) {
  if (isSelected(row)) {
    selected.value = selected.value.filter(s => {
      const sKey = props.rowKey ? (typeof props.rowKey === 'function' ? props.rowKey(s) : s[props.rowKey]) : JSON.stringify(s)
      const rKey = props.rowKey ? (typeof props.rowKey === 'function' ? props.rowKey(row) : row[props.rowKey]) : JSON.stringify(row)
      return sKey !== rKey
    })
  } else {
    selected.value = [...selected.value, row]
  }
  emit('selectionChange', selected.value)
}

function toggleSelectAll() {
  if (isAllSelected.value) {
    selected.value = []
  } else {
    selected.value = [...props.data]
  }
  emit('selectionChange', selected.value)
}

function handleRowClick(row: Record<string, any>, index: number) {
  currentRowIndex.value = index
  emit('rowClick', row, index)
}

function handleSort(key: string) {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortOrder.value = 'asc'
  }
  emit('sortChange', sortKey.value, sortOrder.value)
}

function clearSelection() {
  selected.value = []
  currentRowIndex.value = null
}

defineExpose({ clearSelection })
</script>

<style scoped>
.win11-table-wrapper {
  @apply flex flex-col;
  @apply bg-win11-surface rounded-lg;
  @apply border border-win11-border;
}

.win11-table {
  @apply flex flex-col;
  @apply min-w-0;
  @apply overflow-hidden;
}

.win11-table-header {
  @apply flex-shrink-0;
  @apply border-b border-win11-border;
  @apply bg-win11-control-bg;
}

.win11-table-body {
  @apply flex-1 min-h-0 overflow-x-auto overflow-y-auto;
}

.win11-table-row {
  @apply flex items-center min-w-0;
  @apply border-b border-win11-border;
  @apply transition-colors duration-150;
}

.win11-table-row:last-child {
  @apply border-b-0;
}

.win11-table-row--header {
  @apply bg-win11-control-bg;
}

.win11-table-row:hover {
  @apply bg-win11-control-hover-bg;
}

.win11-table-row.is-selected {
  @apply bg-win11-accent/10;
}

.win11-table-row.is-current {
  @apply bg-win11-control-bg;
  @apply border-l-2 border-l-win11-accent;
}

.win11-table-cell {
  @apply px-4 py-3;
  @apply text-sm text-win11-text;
  @apply min-w-0 shrink overflow-hidden;
}

.win11-table-cell--selection {
  @apply w-12 flex-shrink-0 justify-center;
  @apply flex items-center;
}

.win11-table-cell.is-sortable {
  @apply cursor-pointer select-none;
}

.win11-table-cell.is-sortable:hover {
  @apply text-win11-accent;
}

.sort-indicator {
  @apply ml-1 text-win11-accent;
}

.win11-table-empty {
  @apply flex items-center justify-center py-12;
  @apply text-win11-text-secondary;
}

.win11-table-footer {
  @apply px-4 py-3;
  @apply border-t border-win11-border;
  @apply bg-win11-control-bg;
  @apply text-sm text-win11-text-secondary;
}

.win11-checkbox {
  @apply w-4 h-4 rounded border-2 border-win11-border;
  @apply checked:bg-win11-accent checked:border-win11-accent;
  @apply focus:ring-2 focus:ring-win11-accent/50;
  @apply cursor-pointer;
}
</style>
