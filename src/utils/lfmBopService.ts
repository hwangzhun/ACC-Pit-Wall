import type { BopEntry } from '../types/configuration'
import { getCarModelName } from '../data/mappings'
import { TRACKS } from '../types/defaults'

// LFM API 响应数据结构
export interface LfmApiCar {
  car_model: number
  car_name: string
  car_year: number
  ballast: number
  restrictor: number
  ballast_change?: number
}

export interface LfmApiTrackBop {
  track_name: string
  bop: {
    GT3?: LfmApiCar[]
    GT4?: LfmApiCar[]
    GT2?: LfmApiCar[]
  }
}

export type LfmApiResponse = LfmApiTrackBop[]

/** ACC BOP / 参赛名单 限制器合法范围 0–20 */
export function clampAccBopRestrictor(n: unknown): number {
  const v = Number(n)
  if (Number.isNaN(v)) return 0
  return Math.max(0, Math.min(20, Math.round(v)))
}

// LFM BOP数据接口
export interface LfmBopData {
  track: string
  carModel: number
  ballastKg: number
  restrictor: number
}

// API 配置
const LFM_API_URL = 'https://api3.lowfuelmotorsport.com/api/hotlaps/getAccBop'
const API_TIMEOUT = 30000

// 缓存配置
let apiCache: { data: LfmApiResponse; timestamp: number } | null = null
const CACHE_DURATION = 5 * 60 * 1000 // 5分钟缓存
const LFM_CACHE_STORAGE_KEY = 'lfm_bop_api_cache_v1'

interface PersistedLfmCache {
  data: LfmApiResponse
  timestamp: number
}

function canUseLocalStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function loadPersistedCache(): PersistedLfmCache | null {
  if (!canUseLocalStorage()) return null
  try {
    const raw = window.localStorage.getItem(LFM_CACHE_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<PersistedLfmCache>
    if (
      !parsed ||
      !Array.isArray(parsed.data) ||
      typeof parsed.timestamp !== 'number'
    ) {
      return null
    }
    return {
      data: parsed.data as LfmApiResponse,
      timestamp: parsed.timestamp
    }
  } catch {
    return null
  }
}

function savePersistedCache(cache: PersistedLfmCache): void {
  if (!canUseLocalStorage()) return
  try {
    window.localStorage.setItem(LFM_CACHE_STORAGE_KEY, JSON.stringify(cache))
  } catch {
    // 忽略存储异常（如配额不足），不影响主流程
  }
}

/** 清空直连 LFM API 的内存缓存（Tauri / 浏览器共用） */
export function clearLfmApiCache(): void {
  apiCache = null
  if (canUseLocalStorage()) {
    window.localStorage.removeItem(LFM_CACHE_STORAGE_KEY)
  }
  console.log('[LFM API] 缓存已清除')
}

/** 当前内存缓存元数据；无缓存时返回 null */
export function getLfmApiCacheMeta(): {
  exists: boolean
  isValid: boolean
  timestamp: number
} | null {
  const cache = apiCache ?? loadPersistedCache()
  if (!cache) return null
  if (!apiCache) {
    apiCache = cache
  }
  const age = Date.now() - cache.timestamp
  return {
    exists: true,
    isValid: age < CACHE_DURATION,
    timestamp: cache.timestamp
  }
}

/**
 * 从 LFM API 获取真实 BOP 数据
 */
export async function fetchLfmBopFromApi(): Promise<LfmApiResponse> {
  if (!apiCache) {
    const persisted = loadPersistedCache()
    if (persisted) {
      apiCache = persisted
    }
  }

  // 检查缓存
  if (apiCache && Date.now() - apiCache.timestamp < CACHE_DURATION) {
    console.log('[LFM API] 使用缓存数据')
    return apiCache.data
  }

  try {
    console.log('[LFM API] 正在获取数据...')

    const response = await fetch(LFM_API_URL, {
      method: 'GET',
      signal: AbortSignal.timeout(API_TIMEOUT),
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data: LfmApiResponse = await response.json()

    // 更新缓存
    apiCache = { data, timestamp: Date.now() }
    savePersistedCache(apiCache)

    console.log(`[LFM API] 成功获取 ${data.length} 条赛道数据`)
    return data
  } catch (error) {
    console.error('[LFM API] 获取失败:', error)

    // 如果缓存存在（即使过期），返回过期缓存
    if (apiCache) {
      console.log('[LFM API] 使用过期的缓存数据')
      return apiCache.data
    }

    throw error
  }
}

/**
 * 将 LFM API 数据转换为应用内部格式
 */
export function transformLfmApiData(apiData: LfmApiResponse): BopEntry[] {
  const entries: BopEntry[] = []

  apiData.forEach(trackData => {
    const trackName = trackData.track_name
    const normalizedTrack = normalizeTrackNameFromApi(trackName)

    if (!normalizedTrack) return

    // 处理所有车型类别
    const classes: Array<'GT3' | 'GT4' | 'GT2'> = ['GT3', 'GT4', 'GT2']

    classes.forEach(carClass => {
      const carList = trackData.bop[carClass]
      if (!Array.isArray(carList)) return

      carList.forEach(car => {
        // API 返回的 car_model 直接是 ACC 车型 ID
        entries.push({
          track: normalizedTrack,
          carModel: car.car_model,
          ballastKg: car.ballast,
          restrictor: clampAccBopRestrictor(car.restrictor)
        })
      })
    })
  })

  console.log(`[LFM Transform] 转换完成，共 ${entries.length} 条数据`)
  return entries
}

/**
 * 将 API 赛道名称映射为应用内部使用的赛道标识符
 */
function normalizeTrackNameFromApi(trackName: string): string | null {
  if (!trackName) return null

  // API 返回的是完整赛道名称，需要映射为代码标识符
  const trackMappings: Record<string, string> = {
    // Imola
    'Autodromo Enzo e Dino Ferrari': 'imola',
    'Imola': 'imola',

    // Monza
    'Autodromo Nazionale Monza': 'monza',
    'Monza': 'monza',

    // Spa
    'Circuit de Spa-Francorchamps': 'spa',
    'Spa': 'spa',

    // Silverstone
    'Silverstone Circuit': 'silverstone',
    'Silverstone': 'silverstone',

    // Nürburgring
    'Nürburgring GP': 'nurburgring',
    'Nurburgring': 'nurburgring',

    // Barcelona
    'Circuit de Barcelona-Catalunya': 'barcelona',
    'Barcelona': 'barcelona',

    // Paul Ricard
    'Circuit Paul Ricard': 'paul_ricard',
    'Paul Ricard': 'paul_ricard',

    // Zandvoort
    'Circuit Zandvoort': 'zandvoort',
    'Zandvoort': 'zandvoort',

    // Hungaroring
    'Hungaroring': 'hungaroring',

    // Misano
    'Misano World Circuit': 'misano',
    'Misano': 'misano',

    // Suzuka
    'Suzuka Circuit': 'suzuka',
    'Suzuka': 'suzuka',

    // Kyalami
    'Kyalami Grand Prix Circuit': 'kyalami',
    'Kyalami': 'kyalami',

    // Laguna Seca
    'WeatherTech Raceway Laguna Seca': 'laguna_seca',
    'Laguna Seca': 'laguna_seca',

    // Brands Hatch
    'Brands Hatch Circuit': 'brands_hatch',
    'Brands Hatch': 'brands_hatch',

    // Donington
    'Donington Park': 'donington',
    'Donington': 'donington',

    // Indianapolis
    'Indianapolis Motor Speedway': 'indianapolis',
    'Indianapolis': 'indianapolis',

    // Red Bull Ring
    'Red Bull Ring': 'red_bull_ring',

    // Zolder
    'Circuit Zolder': 'zolder',
    'Zolder': 'zolder',

    // Mount Panorama
    'Mount Panorama Circuit': 'mount_panorama',
    'Mount Panorama': 'mount_panorama',
    'Bathurst': 'mount_panorama'
  }

  // 精确匹配
  if (trackMappings[trackName]) {
    return trackMappings[trackName]
  }

  // 尝试不区分大小写的匹配
  const lowerTrackName = trackName.toLowerCase()
  for (const [key, value] of Object.entries(trackMappings)) {
    if (key.toLowerCase() === lowerTrackName) {
      return value
    }
  }

  // 如果没找到映射，返回原始名称的小写版本（用于调试）
  console.warn(`[LFM Track] 未找到赛道映射: ${trackName}`)
  return trackName.toLowerCase().replace(/\s+/g, '_')
}

// LFM 车型名称到 ACC 车型 ID 的映射
const lfmCarNameToId: Record<string, number> = {
  'porsche 991 gt3 r': 0,
  'mercedes-amg gt3': 1,
  'ferrari 488 gt3': 2,
  'audi r8 lms': 3,
  'lamborghini huracan gt3': 4,
  'mclaren 650s gt3': 5,
  'nissan gt-r nismo gt3 2018': 6,
  'bmw m6 gt3': 7,
  'bentley continental gt3 2018': 8,
  'porsche 991ii gt3 cup': 9,
  'nissan gt-r nismo gt3 2017': 10,
  'bentley continental gt3 2016': 11,
  'aston martin v12 vantage gt3': 12,
  'lamborghini gallardo r-ex': 13,
  'jaguar g3': 14,
  'lexus rc f gt3': 15,
  'lamborghini huracan evo 2019': 16,
  'honda nsx gt3': 17,
  'lamborghini huracan evoii': 18,
  'audi r8 lms evo 2019': 19,
  'aston martin v8 vantage 2019': 20,
  'honda nsx evo 2019': 21,
  'mclaren 720s gt3 2019': 22,
  'porsche 911ii gt3 r 2019': 23,
  'ferrari 488 gt3 evo 2020': 24,
  'mercedes amg gt3 2020': 25,
  'ferrari 488 evo': 26,

  'bmw m2 cs racing': 27,

  'porsche 911 gt3 cup type 992': 28,
  'lamborghini huracan super trofeo evo2': 29,
  'bmw m4 gt3': 30,
  'audi r8 lms gt3 evo ii': 31,
  'ferrari 296 gt3': 32,
  'lamborghini huracan evo2': 33,
  'porsche 992 gt3 r': 34,
  'mclaren 720s gt3 evo 2023': 35,
  'ford mustang gt3': 36,

  // GT4
  'alpine a110 gt4': 50,
  'aston martin v8 vantage gt4': 51,
  'audi r8 lms gt4': 52,
  'bmw m4 gt4': 53,
  'chevrolet camaro gt4': 55,
  'ginetta g55 gt4': 56,
  'ktm x-bow gt4': 47,
  'ktm xbow gt4': 47,
  'maserati mc gt4': 58,
  'mclaren 570s gt4': 59,
  'mercedes-amg gt4': 60,
  'porsche 718 cayman gt4': 51,
  // GT2
  'audi r8 lms gt2': 80,
  'ktm xbow gt2': 82,
  'maserati mc20 gt2': 83,
  'mercedes amg gt2': 84,
  'porsche 911 gt2 rs cs evo': 85,
  'porsche 935': 86
}

// 从车型 ID 获取车型名称
export function getCarNameById(carId: number): string {
  return getCarModelName(carId)
}

// 根据 LFM 车型名称获取 ACC 车型 ID
export function getCarIdByLfmName(lfmCarName: string): number | null {
  if (!lfmCarName) return null

  const normalizedName = lfmCarName.toLowerCase().trim()

  // 精确匹配
  if (lfmCarNameToId[normalizedName] !== undefined) {
    return lfmCarNameToId[normalizedName]
  }

  // 模糊匹配
  for (const [key, id] of Object.entries(lfmCarNameToId)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return id
    }
  }

  return null
}

// 规范化赛道名称，确保与应用中的赛道名称（TRACK_NAMES keys）匹配
export function normalizeTrackName(track: string): string {
  if (!track) return track

  const trackLower = track.toLowerCase().trim()

  // LFM API 完整名称 + 短名称 → TRACK_NAMES key 的映射
  const trackMappings: Record<string, string> = {
    // Imola
    'autodromo enzo e dino ferrari': 'imola',
    'imola': 'imola',

    // Monza
    'autodromo nazionale di monza': 'monza',
    'autodromo nazionale monza': 'monza',
    'monza': 'monza',

    // Brands Hatch
    'brands hatch circuit': 'brands_hatch',
    'brands hatch': 'brands_hatch',
    'brands_hatch': 'brands_hatch',

    // Barcelona / Catalunya
    'circuit de catalunya': 'barcelona',
    'circuit de barcelona-catalunya': 'barcelona',
    'barcelona': 'barcelona',
    'catalunya': 'barcelona',

    // Paul Ricard
    'circuit de paul ricard': 'paul_ricard',
    'circuit paul ricard': 'paul_ricard',
    'paul ricard': 'paul_ricard',
    'paul_ricard': 'paul_ricard',
    'le castellet': 'paul_ricard',

    // Spa
    'circuit de spa francorchamps': 'spa',
    'circuit de spa-francorchamps': 'spa',
    'spa francorchamps': 'spa',
    'spa-francorchamps': 'spa',
    'spa': 'spa',

    // COTA
    'circuit of the americas': 'cota',
    'cota': 'cota',

    // Valencia
    'circuit ricardo tormo': 'valencia',
    'valencia': 'valencia',

    // Donington
    'donington park': 'donington',
    'donington': 'donington',

    // Hungaroring
    'hungaroring': 'hungaroring',
    'hungary': 'hungaroring',

    // Indianapolis
    'indianapolis motor speedway': 'indianapolis',
    'indianapolis': 'indianapolis',
    'indy': 'indianapolis',

    // Kyalami
    'kyalami grand prix circuit': 'kyalami',
    'kyalami': 'kyalami',

    // Laguna Seca
    'weathertech raceway laguna seca': 'laguna_seca',
    'laguna seca': 'laguna_seca',
    'laguna_seca': 'laguna_seca',

    // Misano
    'misano world circuit': 'misano',
    'misano': 'misano',

    // Mount Panorama / Bathurst
    'mount panorama circuit': 'mount_panorama',
    'mount panorama': 'mount_panorama',
    'mount_panorama': 'mount_panorama',
    'bathurst': 'mount_panorama',

    // Nürburgring GP
    'nürburgring': 'nurburgring',
    'nurburgring': 'nurburgring',
    'nürburgring gp': 'nurburgring',
    'nurburgring gp': 'nurburgring',

    // Nürburgring 24h
    'nürburgring nordschleife 24h': 'nurburgring_24h',
    'nurburgring nordschleife 24h': 'nurburgring_24h',
    'nurburgring_24h': 'nurburgring_24h',

    // Oulton Park
    'oulton park': 'oulton_park',
    'oulton_park': 'oulton_park',

    // Silverstone
    'silverstone circuit': 'silverstone',
    'silverstone': 'silverstone',

    // Snetterton
    'snetterton': 'snetterton',

    // Red Bull Ring / Spielberg
    'spielberg - red bull ring': 'red_bull_ring',
    'spielberg': 'red_bull_ring',
    'red bull ring': 'red_bull_ring',
    'red_bull_ring': 'red_bull_ring',

    // Suzuka
    'suzuka circuit': 'suzuka',
    'suzuka': 'suzuka',

    // Watkins Glen
    'watkins glen': 'watkins_glen',
    'watkins_glen': 'watkins_glen',

    // Zandvoort
    'circuit zandvoort': 'zandvoort',
    'zandvoort': 'zandvoort',

    // Zolder
    'circuit zolder': 'zolder',
    'zolder': 'zolder',
  }

  return trackMappings[trackLower] || trackLower
}

// 获取所有可用的赛道列表（与 TRACK_NAMES / TRACKS 一致）
export function getAvailableTracks(): string[] {
  return [...TRACKS]
}

// 转换LFM BOP数据为应用格式
export function transformLfmBop(lfmData: any): BopEntry[] {
  const entries: BopEntry[] = []

  if (!lfmData) return entries

  // 处理 LFM API 返回的完整数据结构
  // LFM 返回格式: [{ track_name: "Monza", bop: { GT3: [{ car_name, car_year, restrictor, ballast }, ...] }}]
  if (Array.isArray(lfmData)) {
    lfmData.forEach(trackData => {
      const trackName = trackData.track_name || trackData.track || trackData.trackName
      const normalizedTrack = normalizeTrackName(trackName)

      if (!normalizedTrack) return

      // 处理 GT3/GT4/GT2 数据
      const bopData = trackData.bop || trackData
      const classes = ['GT3', 'GT4', 'GT2']

      classes.forEach(carClass => {
        const carList = bopData[carClass]
        if (Array.isArray(carList)) {
          carList.forEach(car => {
            const carModelId = getCarIdByLfmName(car.car_name || car.carModel)
            if (carModelId !== null) {
              entries.push({
                track: normalizedTrack,
                carModel: carModelId,
                ballastKg: Number(car.ballast || car.ballastKg || 0),
                restrictor: clampAccBopRestrictor(car.restrictor ?? 0)
              })
            }
          })
        }
      })
    })
  } else if (typeof lfmData === 'object') {
    // 兼容旧格式
    Object.keys(lfmData).forEach(key => {
      const item = lfmData[key]
      if (item.track && item.carModel !== undefined) {
        entries.push({
          track: normalizeTrackName(item.track),
          carModel: Number(item.carModel),
          ballastKg: Number(item.ballastKg || 0),
          restrictor: clampAccBopRestrictor(item.restrictor ?? 0)
        })
      }
    })
  }

  return entries
}

// 赛车规格类型
export type CarClass = 'GT3' | 'GT4' | 'GT2'

// 各规格的车型 ID 范围
export const carClassRanges: Record<CarClass, { min: number; max: number }> = {
  GT3: { min: 0, max: 36 },
  GT4: { min: 50, max: 61 },
  GT2: { min: 80, max: 86 }
}

// LFM 车型默认 BOP 值 (用于生成示例数据)
const defaultBopValues: Record<string, { restrictor: number; ballast: number }> = {
  'porsche 991 gt3 r': { restrictor: 0, ballast: 0 },
  'mercedes-amg gt3': { restrictor: 0, ballast: 0 },
  'ferrari 488 gt3': { restrictor: 4, ballast: 10 },
  'audi r8 lms': { restrictor: 0, ballast: 0 },
  'lamborghini huracan gt3': { restrictor: 0, ballast: 0 },
  'mclaren 650s gt3': { restrictor: 6, ballast: 15 },
  'nissan gt-r nismo gt3 2018': { restrictor: 0, ballast: 0 },
  'bmw m6 gt3': { restrictor: 0, ballast: 0 },
  'bentley continental gt3 2018': { restrictor: 0, ballast: 0 }
}

// 生成示例 BOP 数据
export function generateSampleBopData(
  tracks: string | string[] | 'all' = 'all',
  carClass: CarClass = 'GT3'
): BopEntry[] {
  const entries: BopEntry[] = []

  // 确定要使用的赛道列表
  const trackList = tracks === 'all'
    ? getAvailableTracks()
    : Array.isArray(tracks)
      ? tracks
      : [tracks]

  // 获取对应规格的车型 ID 范围
  const classRange = carClassRanges[carClass]

  // 筛选对应规格的车型
  const classCars = Object.keys(lfmCarNameToId).filter(key => {
    const id = lfmCarNameToId[key]
    return id >= classRange.min && id <= classRange.max
  })

  // 为每个赛道和每辆车生成 BOP 条目
  trackList.forEach(track => {
    classCars.forEach(carName => {
      const carId = lfmCarNameToId[carName]
      const bopSettings = defaultBopValues[carName] || { restrictor: 0, ballast: 0 }

      // 根据车型分配不同的 BOP 值（限制器 0–20）
      const carIndex = classCars.indexOf(carName)
      const ballast = bopSettings.ballast + (carIndex % 5) * 5 - 10
      const restrictor = clampAccBopRestrictor(
        bopSettings.restrictor + (carIndex % 3) * 2 - 2
      )

      entries.push({
        track: track,
        carModel: carId,
        ballastKg: ballast,
        restrictor
      })
    })
  })

  return entries
}

// 从 BOP 条目列表生成 JSON 字符串
export function generateBopJson(entries: BopEntry[]): string {
  const bopData = { entries }
  return JSON.stringify(bopData, null, 2)
}

/**
 * 一站式获取 LFM BOP 数据
 * 从 API 获取并转换为应用格式
 */
export async function fetchLfmBop(): Promise<BopEntry[]> {
  const apiData = await fetchLfmBopFromApi()
  return transformLfmApiData(apiData)
}
