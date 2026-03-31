import { ElMessage, ElMessageBox } from 'element-plus'
import { useBopState } from './useBopState'
import { useBopSelection } from './useBopSelection'
import type { BopEntry } from '../../../types/bop'
import { generateSampleBopData, type CarClass } from '../../../utils/lfmBopService'

export function useBopCrud() {
  const { entries, selectedTrack } = useBopState()
  const { selectedEntryIds, clearSelection } = useBopSelection()

  // 添加新条目
  function addEntry(track?: string) {
    const newEntry: BopEntry = {
      track: track || selectedTrack.value === 'all' ? 'monza' : selectedTrack.value,
      carModel: 0,
      ballastKg: 0,
      restrictor: 0
    }
    entries.value.push(newEntry)
    ElMessage.success('已添加BOP条目')
    return newEntry
  }

  // 删除单个条目
  async function deleteEntry(index: number) {
    try {
      await ElMessageBox.confirm('确定要删除这个BOP条目吗？', '确认删除', {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      })

      entries.value.splice(index, 1)
      // 调整选中的索引
      const newSelectedIds = new Set<number>()
      selectedEntryIds.value.forEach((id: number) => {
        if (id < index) {
          newSelectedIds.add(id)
        } else if (id > index) {
          newSelectedIds.add(id - 1)
        }
      })
      selectedEntryIds.value = newSelectedIds

      ElMessage.success('已删除')
    } catch {
      // 用户取消
    }
  }

  // 批量删除
  async function batchDelete() {
    const count = selectedEntryIds.value.size
    if (count === 0) {
      ElMessage.warning('请先选择要删除的条目')
      return
    }

    try {
      await ElMessageBox.confirm(`确定要删除选中的 ${count} 个BOP条目吗？`, '确认批量删除', {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      })

      // 从后往前删除，避免索引变化
      const indices = Array.from(selectedEntryIds.value).sort((a, b) => (b as number) - (a as number))
      indices.forEach((index) => {
        entries.value.splice(index as number, 1)
      })

      clearSelection()
      ElMessage.success(`已删除 ${count} 个条目`)
    } catch {
      // 用户取消
    }
  }

  // 复制条目
  function duplicateEntry(index: number) {
    const entry = entries.value[index]
    if (!entry) return

    const newEntry: BopEntry = {
      ...entry,
      // 可以在这里修改一些默认值
    }
    entries.value.splice(index + 1, 0, newEntry)
    ElMessage.success('已复制条目')
  }

  // 从LFM导入
  function importFromLFM(track: string | 'all', carClass: CarClass) {
    const trackParam = track === 'all' ? 'all' : track
    const sampleData = generateSampleBopData(trackParam, carClass)

    // 可以选择替换或追加
    entries.value.length = 0
    entries.value.push(...sampleData)

    const trackLabel = track === 'all' ? '全部赛道' : track
    ElMessage.success(`成功导入 ${trackLabel} 的 ${carClass} 数据 (${sampleData.length} 条)`)

    return sampleData.length
  }

  // 获取条目索引
  function getEntryIndex(entry: BopEntry): number {
    return entries.value.findIndex(e =>
      e.track === entry.track &&
      e.carModel === entry.carModel
    )
  }

  // 更新条目
  function updateEntry(index: number, updates: Partial<BopEntry>) {
    if (index >= 0 && index < entries.value.length) {
      entries.value[index] = { ...entries.value[index], ...updates }
    }
  }

  return {
    // CRUD 操作
    addEntry,
    deleteEntry,
    batchDelete,
    duplicateEntry,
    updateEntry,
    getEntryIndex,
    // 导入
    importFromLFM
  }
}
