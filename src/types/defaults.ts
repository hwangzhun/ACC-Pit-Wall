import type {
  Configuration,
  Settings,
  Event,
  EventRules,
  AssistRules,
  EntryList,
  Bop
} from './configuration'

/** 赛道显示名（单一数据源：id → 中/英） */
export type TrackNameI18n = { zh: string; en: string }

export const TRACK_NAMES: Record<string, TrackNameI18n> = {
  monza: { zh: '蒙扎赛道', en: 'Monza' },
  zolder: { zh: '佐尔德赛道', en: 'Zolder' },
  brands_hatch: { zh: '布兰兹哈奇赛道', en: 'Brands Hatch' },
  silverstone: { zh: '银石赛道', en: 'Silverstone' },
  paul_ricard: { zh: '保罗里卡德赛道', en: 'Paul Ricard' },
  misano: { zh: '米萨诺赛道', en: 'Misano' },
  spa: { zh: '斯帕赛道', en: 'Spa' },
  nurburgring: { zh: '纽博格林南环赛道', en: 'Nürburgring' },
  barcelona: { zh: '巴塞罗那赛道', en: 'Barcelona' },
  hungaroring: { zh: '亨格罗宁赛道', en: 'Hungaroring' },
  zandvoort: { zh: '赞德沃特赛道', en: 'Zandvoort' },
  kyalami: { zh: '卡亚拉米赛道', en: 'Kyalami' },
  mount_panorama: { zh: '帕诺拉马山赛道', en: 'Mount Panorama' },
  suzuka: { zh: '铃鹿赛道', en: 'Suzuka' },
  laguna_seca: { zh: '拉古纳塞卡赛道', en: 'Laguna Seca' },
  imola: { zh: '伊莫拉赛道', en: 'Imola' },
  oulton_park: { zh: '奥顿公园赛道', en: 'Oulton Park' },
  donington: { zh: '多宁顿赛道', en: 'Donington' },
  snetterton: { zh: '斯内特顿赛道', en: 'Snetterton' },
  cota: { zh: '美洲赛道', en: 'COTA' },
  indianapolis: { zh: '印第安纳波利斯赛道', en: 'Indianapolis' },
  watkins_glen: { zh: '沃特金斯格伦赛道', en: 'Watkins Glen' },
  valencia: { zh: '瓦伦西亚赛道', en: 'Valencia' },
  nurburgring_24h: { zh: '纽博格林北环赛道', en: 'Nürburgring 24h' },
  red_bull_ring: { zh: '红牛环赛道', en: 'Red Bull Ring' },
}

// 赛道列表（从 TRACK_NAMES 自动生成，保持兼容性）
export const TRACKS = Object.keys(TRACK_NAMES)

/** 按当前语言显示赛道名；未知 id 原样返回 */
export function formatTrackName(track: string, lang: 'zh' | 'en' = 'zh'): string {
  const entry = TRACK_NAMES[track]
  if (!entry) return track
  return entry[lang]
}

// API 赛道名称到代码标识符的映射
// LFM API 返回完整赛道名称，需要映射为代码标识符
export const TRACK_NAME_API_TO_CODE: Record<string, string> = {
  // Imola
  'Autodromo Enzo e Dino Ferrari': 'imola',
  'Imola': 'imola',

  // Monza
  'Autodromo Nazionale di Monza': 'monza',
  'Autodromo Nazionale Monza': 'monza',
  'Monza': 'monza',

  // Spa
  'Circuit de Spa Francorchamps': 'spa',
  'Circuit de Spa-Francorchamps': 'spa',
  'Spa': 'spa',
  'Spa-Francorchamps': 'spa',

  // Silverstone
  'Silverstone Circuit': 'silverstone',
  'Silverstone': 'silverstone',

  // Nürburgring GP
  'Nürburgring GP': 'nurburgring',
  'Nürburgring': 'nurburgring',
  'Nurburgring': 'nurburgring',

  // Nürburgring 24h
  'Nürburgring Nordschleife 24h': 'nurburgring_24h',
  'Nurburgring Nordschleife 24h': 'nurburgring_24h',

  // Barcelona
  'Circuit de Catalunya': 'barcelona',
  'Circuit de Barcelona-Catalunya': 'barcelona',
  'Barcelona': 'barcelona',
  'Catalunya': 'barcelona',

  // Paul Ricard
  'Circuit de Paul Ricard': 'paul_ricard',
  'Circuit Paul Ricard': 'paul_ricard',
  'Paul Ricard': 'paul_ricard',
  'Le Castellet': 'paul_ricard',

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

  // Red Bull Ring / Spielberg
  'Spielberg - Red Bull Ring': 'red_bull_ring',
  'Red Bull Ring': 'red_bull_ring',
  'Spielberg': 'red_bull_ring',

  // Zolder
  'Circuit Zolder': 'zolder',
  'Zolder': 'zolder',

  // Mount Panorama
  'Mount Panorama Circuit': 'mount_panorama',
  'Mount Panorama': 'mount_panorama',
  'Bathurst': 'mount_panorama',

  // Oulton Park
  'Oulton Park': 'oulton_park',

  // Snetterton
  'Snetterton': 'snetterton',

  // COTA
  'Circuit Of The Americas': 'cota',

  // Valencia
  'Circuit Ricardo Tormo': 'valencia',

  // Watkins Glen
  'Watkins Glen': 'watkins_glen',
}

/**
 * 将 API 返回的赛道名称映射为代码标识符
 * @param {string} apiTrackName - API 返回的赛道名称
 * @returns {string} 代码标识符
 */
export function normalizeTrackNameFromApi(
  apiTrackName: string | null | undefined
): string | null {
  if (!apiTrackName) return null

  // 直接匹配
  if (TRACK_NAME_API_TO_CODE[apiTrackName]) {
    return TRACK_NAME_API_TO_CODE[apiTrackName]
  }

  // 尝试不区分大小写匹配
  const lowerTrackName = apiTrackName.toLowerCase()
  for (const [key, value] of Object.entries(TRACK_NAME_API_TO_CODE)) {
    if (key.toLowerCase() === lowerTrackName) {
      return value
    }
  }

  // 尝试部分匹配（如 "Imola" 匹配 "Autodromo Enzo e Dino Ferrari"）
  for (const [key, value] of Object.entries(TRACK_NAME_API_TO_CODE)) {
    if (key.toLowerCase().includes(lowerTrackName) ||
        lowerTrackName.includes(key.toLowerCase())) {
      return value
    }
  }

  // 未找到映射，返回原值（用于调试）
  console.warn(`[Track Mapping] 未找到赛道映射: ${apiTrackName}`)
  return apiTrackName.toLowerCase().replace(/\s+/g, '_')
}

// 车辆组
export const CAR_GROUPS = ['FreeForAll', 'GT3', 'GT4', 'GT2', 'GTC', 'TCX']

// 默认配置值
export function defaultConfiguration(): Configuration {
  return {
    udpPort: 9231,
    tcpPort: 9232,
    maxConnections: 30,
    lanDiscovery: 0,
    registerToLobby: 1,
    configVersion: 1
  }
}

export function defaultSettings(): Settings {
  return {
    serverName: 'My ACC Server',
    adminPassword: '',
    password: '',
    spectatorPassword: '',
    centralEntryListPath: '',
    carGroup: 'GT3',
    trackMedalsRequirement: 0,
    safetyRatingRequirement: -1,
    racecraftRatingRequirement: -1,
    maxCarSlots: 20,
    isRaceLocked: 0,
    isLockedPrepPhase: 0,
    shortFormationLap: 1,
    dumpLeaderboards: 1,
    dumpEntryList: 1,
    randomizeTrackWhenEmpty: 0,
    allowAutoDQ: 1,
    ignorePrematureDisconnects: 0,
    formationLapType: 3,
    configVersion: 1
  }
}

/** 合并外部 settings 时保证管理员密码缺失或为 null 时为空字符串（默认不设置） */
export function normalizeSettings(patch: Partial<Settings> | undefined): Settings {
  const base = defaultSettings()
  if (!patch) return base
  return {
    ...base,
    ...patch,
    adminPassword: patch.adminPassword ?? '',
  }
}

export function defaultEvent(): Event {
  return {
    ambientTemp: 22,
    cloudLevel: 0.1,
    configVersion: 1,
    isFixedConditionQualification: 0,
    postQualySeconds: 120,
    postRaceSeconds: 120,
    preRaceWaitingTimeSeconds: 80,
    rain: 0.0,
    sessionOverTimeSeconds: 120,
    sessions: [],
    simracerWeatherConditions: 0,
    track: 'monza',
    weatherRandomness: 1
  }
}

export function defaultEventRules(): EventRules {
  return {
    qualifyStandingType: 1,
    pitWindowLengthSec: -1,
    driverStintTimeSec: 0,
    mandatoryPitstopCount: 0,
    maxTotalDrivingTime: 0,
    maxDriversCount: 1,
    tyreSetCount: 50,
    isRefuellingAllowedInRace: true,
    isRefuellingTimeFixed: false,
    isMandatoryPitstopRefuellingRequired: false,
    isMandatoryPitstopTyreChangeRequired: false,
    isMandatoryPitstopSwapDriverRequired: false
  }
}

export function defaultAssistRules(): AssistRules {
  return {
    disableIdealLine: 0,
    disableAutosteer: 0,
    stabilityControlLevelMax: 100,
    disableAutoPitLimiter: 0,
    disableAutoGear: 0,
    disableAutoClutch: 0,
    disableAutoEngineStart: 0,
    disableAutoWiper: 0,
    disableAutoLights: 0
  }
}

export function defaultEntryList(): EntryList {
  return {
    entries: [],
    forceEntryList: 0
  }
}

export function defaultBop(): Bop {
  return {
    entries: []
  }
}
