import type { BopEntry } from '../types/configuration'
import { clampAccBopRestrictor, type CarClass } from '../utils/lfmBopService'
import {
  clearLfmApiCache,
  fetchLfmBopFromApi,
  getLfmApiCacheMeta
} from '../utils/lfmBopService'

// Tauri 环境检测
function isTauriRuntime(): boolean {
  return typeof window !== 'undefined' && !!(window as any).__TAURI__
}

export interface LfmBopItem {
  track: string
  carName: string
  carModel: number
  ballastKg: number
  restrictor: number
  carClass?: string
}

export interface LfmBopResponse {
  success: boolean
  data: LfmBopItem[]
  fromCache: boolean
  expired?: boolean
  timestamp: string
}

export interface LfmBopStatus {
  success: boolean
  exists: boolean
  isValid: boolean
  age: number
  daysRemaining: number
  entryCount: number
  timestamp?: number
}

// ============================================================================
// Tauri Rust 缓存命令接口
// ============================================================================

interface TauriLfmBopResponse {
  success: boolean
  data: any
  from_cache: boolean
  from_api?: boolean
  last_fetched_at?: number
  source_timestamp?: number
  message: string
  api_error?: string
  cache_write_failed?: boolean
  cache_error?: string
}

interface TauriLfmBopStatus {
  exists: boolean
  is_valid: boolean
  last_fetched_at?: number
  next_update_at?: number
  message: string
}

/**
 * 从 Rust 缓存获取 LFM BOP 数据（带周更检查）
 */
async function getLfmBopFromTauriCache(forceRefresh: boolean): Promise<LfmBopResponse> {
  const { invoke } = await import('@tauri-apps/api/core')
  
  try {
    const result = await invoke<TauriLfmBopResponse>('get_lfm_bop_cached', { 
      forceRefresh 
    })
    
    if (result.success && result.data) {
      // 转换 Rust 返回的数据格式
      const entries = transformTauriBopData(result.data)
      
      return {
        success: true,
        data: entries,
        fromCache: result.from_cache,
        expired: !result.from_cache,
        timestamp: result.last_fetched_at?.toString() || Date.now().toString()
      }
    }
    
    throw new Error(result.message || '从缓存获取数据失败')
  } catch (error) {
    throw error instanceof Error ? error : new Error(String(error))
  }
}

/**
 * 获取 Rust 缓存状态
 */
async function getTauriLfmBopStatus(): Promise<LfmBopStatus> {
  const { invoke } = await import('@tauri-apps/api/core')
  
  try {
    const result = await invoke<TauriLfmBopStatus>('get_lfm_bop_cache_status')
    
    return {
      success: true,
      exists: result.exists,
      isValid: result.is_valid,
      age: result.last_fetched_at ? Date.now() - result.last_fetched_at : 0,
      daysRemaining: 0, // 周更策略下不计算剩余天数
      entryCount: 0, // 状态接口不返回条目数
      timestamp: result.last_fetched_at
    }
  } catch (error) {
    throw error instanceof Error ? error : new Error(String(error))
  }
}

/**
 * 转换 Rust 返回的 LFM 数据格式为 LfmBopItem[]
 */
function transformTauriBopData(data: any): LfmBopItem[] {
  const items: LfmBopItem[] = []
  
  if (Array.isArray(data)) {
    // LFM API 返回格式: [{ track_name: "Monza", bop: { GT3: [...], GT4: [...] } }]
    data.forEach((trackData: any) => {
      const trackName = trackData.track_name || trackData.track
      const bop = trackData.bop || trackData
      
      const classes: Array<'GT3' | 'GT4' | 'GT2'> = ['GT3', 'GT4', 'GT2']
      
      classes.forEach(carClass => {
        const carList = bop[carClass]
        if (Array.isArray(carList)) {
          carList.forEach((car: any) => {
            items.push({
              track: trackName,
              carName: car.car_name || '',
              carModel: car.car_model || 0,
              ballastKg: car.ballast || 0,
              restrictor: car.restrictor || 0,
              carClass
            })
          })
        }
      })
    })
  }
  
  return items
}

/**
 * 获取全部 LFM BOP 数据
 * 1) Tauri 环境优先使用 Rust 缓存
 * 2) 失败时回退到前端直连 LFM API（不依赖 Node 后端）
 */
export async function fetchAllLfmBop(forceRefresh?: boolean): Promise<LfmBopResponse> {
  try {
    if (isTauriRuntime()) {
      return await getLfmBopFromTauriCache(forceRefresh || false)
    }

    if (forceRefresh) {
      clearLfmApiCache()
    }
    const apiData = await fetchLfmBopFromApi()
    return {
      success: true,
      data: transformTauriBopData(apiData),
      fromCache: !forceRefresh,
      timestamp: Date.now().toString()
    }
  } catch (error) {
    // Tauri invoke 失败时也回退直连 LFM
    try {
      if (forceRefresh) {
        clearLfmApiCache()
      }
      const apiData = await fetchLfmBopFromApi()
      return {
        success: true,
        data: transformTauriBopData(apiData),
        fromCache: !forceRefresh,
        timestamp: Date.now().toString()
      }
    } catch {
      if (error instanceof Error) {
        throw error
      }
      throw new Error(String(error))
    }
  }
}

/**
 * 获取缓存状态
 * Tauri 用 Rust 状态；非 Tauri 用前端本地缓存状态
 */
export async function getLfmBopStatus(): Promise<LfmBopStatus> {
  if (isTauriRuntime()) {
    return getTauriLfmBopStatus()
  }

  const meta = getLfmApiCacheMeta()
  return {
    success: true,
    exists: !!meta?.exists,
    isValid: !!meta?.isValid,
    age: meta ? Date.now() - meta.timestamp : 0,
    daysRemaining: 0,
    entryCount: 0,
    timestamp: meta?.timestamp
  }
}

/**
 * 强制刷新缓存
 * Tauri 用 Rust 刷新；非 Tauri 清前端缓存后直连刷新
 */
export async function refreshLfmBopCache(): Promise<LfmBopResponse> {
  if (isTauriRuntime()) {
    return getLfmBopFromTauriCache(true)
  }
  clearLfmApiCache()
  return fetchAllLfmBop(true)
}

/**
 * 转换服务器返回的数据为应用格式
 */
export function transformServerBopToEntries(
  serverData: LfmBopItem[],
  targetTrack: string | 'all',
  carClass: CarClass | 'all',
  _getCarIdByLfmName: (name: string) => number | null,
  normalizeTrackName: (track: string) => string
): BopEntry[] {
  const entries: BopEntry[] = []

  serverData.forEach((item) => {
    // 按规格过滤（全部规格时不筛）
    if (carClass !== 'all' && item.carClass && item.carClass !== carClass) {
      return
    }

    const normalizedTrack = normalizeTrackName(item.track)

    // 按赛道过滤
    if (targetTrack !== 'all' && normalizedTrack !== targetTrack) {
      return
    }

    // 直接使用 API 返回的 carModel（ACC 数字 ID），避免 carName 映射不全的问题
    if (item.carModel !== undefined && item.carModel !== null) {
      entries.push({
        track: normalizedTrack,
        carModel: item.carModel,
        ballastKg: item.ballastKg,
        restrictor: clampAccBopRestrictor(item.restrictor)
      })
    }
  })

  return entries
}
