import { computed } from 'vue'
import { useBopState } from './useBopState'
import type { BopEntry } from '../../../types/bop'

export function useBopSelection() {
  const { selectedEntryIds, editingEntry, editingIndex, entries } = useBopState()

  // 是否全选
  const isAllSelected = computed(() => {
    return entries.value.length > 0 && selectedEntryIds.value.size === entries.value.length
  })

  // 是否部分选中
  const isIndeterminate = computed(() => {
    return selectedEntryIds.value.size > 0 && selectedEntryIds.value.size < entries.value.length
  })

  // 选中的条目列表
  const selectedEntries = computed(() => {
    return entries.value.filter((_, index) => selectedEntryIds.value.has(index))
  })

  // 选中数量
  const selectedCount = computed(() => selectedEntryIds.value.size)

  // 切换全选
  function toggleSelectAll() {
    if (isAllSelected.value) {
      selectedEntryIds.value.clear()
    } else {
      selectedEntryIds.value = new Set(entries.value.map((_, index) => index))
    }
  }

  // 切换单个选中
  function toggleSelect(index: number) {
    const newSet = new Set(selectedEntryIds.value)
    if (newSet.has(index)) {
      newSet.delete(index)
    } else {
      newSet.add(index)
    }
    selectedEntryIds.value = newSet
  }

  // 选中单个
  function select(index: number) {
    selectedEntryIds.value = new Set([index])
  }

  // 清除选中
  function clearSelection() {
    selectedEntryIds.value.clear()
  }

  // 设置编辑条目
  function setEditingEntry(entry: BopEntry | null, index: number | null = null) {
    editingEntry.value = entry
    editingIndex.value = index
  }

  // 清除编辑
  function clearEditing() {
    editingEntry.value = null
    editingIndex.value = null
  }

  return {
    // 状态
    selectedEntryIds,
    // 计算属性
    isAllSelected,
    isIndeterminate,
    selectedEntries,
    selectedCount,
    // 方法
    toggleSelectAll,
    toggleSelect,
    select,
    clearSelection,
    setEditingEntry,
    clearEditing
  }
}
