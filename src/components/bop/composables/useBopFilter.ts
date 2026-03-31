import { computed } from 'vue'
import { useBopState } from './useBopState'

// 车型分类
const GT3_CAR_IDS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36]
const GT4_CAR_IDS = [50, 51, 52, 53, 55, 56, 57, 58, 59, 60, 61]
const GT2_CAR_IDS = [80, 82, 83, 84, 85, 86]

export function getCarClass(carModel: number): 'GT3' | 'GT4' | 'GT2' | 'unknown' {
  if (GT3_CAR_IDS.includes(carModel)) return 'GT3'
  if (GT4_CAR_IDS.includes(carModel)) return 'GT4'
  if (GT2_CAR_IDS.includes(carModel)) return 'GT2'
  return 'unknown'
}

export function useBopFilter() {
  const { entries, filter, sort, selectedTrack } = useBopState()

  // 按赛道筛选
  const filteredByTrack = computed(() => {
    const track = selectedTrack.value
    if (track === 'all') return entries.value
    return entries.value.filter(entry => entry.track === track)
  })

  // 按分类筛选
  const filteredByClass = computed(() => {
    const carClass = filter.value.carClass
    if (carClass === 'all') return filteredByTrack.value
    return filteredByTrack.value.filter(entry => getCarClass(entry.carModel) === carClass)
  })

  // 按搜索关键词筛选
  const filteredBySearch = computed(() => {
    const keyword = filter.value.searchKeyword.toLowerCase().trim()
    if (!keyword) return filteredByClass.value

    return filteredByClass.value.filter(entry => {
      // 这里可以扩展搜索逻辑
      return entry.track.toLowerCase().includes(keyword)
    })
  })

  // 排序后的结果
  const filteredAndSortedEntries = computed(() => {
    const result = [...filteredBySearch.value]
    const { field, order } = sort.value

    result.sort((a, b) => {
      let comparison = 0
      switch (field) {
        case 'carModel':
          comparison = a.carModel - b.carModel
          break
        case 'ballastKg':
          comparison = a.ballastKg - b.ballastKg
          break
        case 'restrictor':
          comparison = a.restrictor - b.restrictor
          break
      }
      return order === 'asc' ? comparison : -comparison
    })

    return result
  })

  // 各赛道的条目数量统计
  const trackStats = computed(() => {
    const stats = new Map<string, number>()
    entries.value.forEach(entry => {
      const count = stats.get(entry.track) || 0
      stats.set(entry.track, count + 1)
    })
    return stats
  })

  return {
    filteredEntries: filteredAndSortedEntries,
    trackStats,
    getCarClass
  }
}
