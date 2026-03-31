// configuration.json - 网络端口配置
export interface Configuration {
  udpPort: number
  tcpPort: number
  maxConnections: number
  lanDiscovery: number
  registerToLobby: number
  configVersion: number
}

// settings.json - 服务器基本设置
export interface Settings {
  serverName: string
  adminPassword: string
  password: string
  spectatorPassword: string
  centralEntryListPath: string
  carGroup: string
  trackMedalsRequirement: number
  safetyRatingRequirement: number
  racecraftRatingRequirement: number
  maxCarSlots: number
  isRaceLocked: number
  isLockedPrepPhase: number
  shortFormationLap: number
  dumpLeaderboards: number
  dumpEntryList: number
  randomizeTrackWhenEmpty: number
  allowAutoDQ: number
  ignorePrematureDisconnects: number
  formationLapType: number
  configVersion: number
}

// event.json - 赛事和天气配置
export interface Event {
  ambientTemp: number
  cloudLevel: number
  configVersion: number
  isFixedConditionQualification: number
  postQualySeconds: number
  postRaceSeconds: number
  preRaceWaitingTimeSeconds: number
  rain: number
  sessionOverTimeSeconds: number
  sessions: Session[]
  simracerWeatherConditions: number
  track: string
  weatherRandomness: number
}

export interface Session {
  dayOfWeekend: number
  hourOfDay: number
  sessionDurationMinutes: number
  sessionType: 'P' | 'Q' | 'R'
  timeMultiplier: number
}

// eventRules.json - 赛事规则
export interface EventRules {
  qualifyStandingType: number
  pitWindowLengthSec: number
  driverStintTimeSec: number
  mandatoryPitstopCount: number
  maxTotalDrivingTime: number
  maxDriversCount: number
  tyreSetCount: number
  isRefuellingAllowedInRace: boolean
  isRefuellingTimeFixed: boolean
  isMandatoryPitstopRefuellingRequired: boolean
  isMandatoryPitstopTyreChangeRequired: boolean
  isMandatoryPitstopSwapDriverRequired: boolean
}

// assistRules.json - 辅助设置
export interface AssistRules {
  disableIdealLine: number
  disableAutosteer: number
  stabilityControlLevelMax: number
  disableAutoPitLimiter: number
  disableAutoGear: number
  disableAutoClutch: number
  disableAutoEngineStart: number
  disableAutoWiper: number
  disableAutoLights: number
}

// entrylist.json - 参赛名单
export interface EntryList {
  entries: Entry[]
  /** 0=不强制，1=仅 entrylist 内车手可进服 */
  forceEntryList: number
}

export interface Entry {
  teamName: string
  raceNumber: number
  defaultGridPosition: number
  ballastKg: number
  restrictor: number
  isServerAdmin: number
  forcedCarModel: number
  overrideCarModelForCustomCar: number
  overrideDriverInfo: number
  customCar: string
  drivers: Driver[]
}

export interface Driver {
  driverCategory: number
  firstName: string
  lastName: string
  playerID: string
  shortName: string
  nationality: number
}

// bop.json - 性能平衡设置
export interface Bop {
  entries: BopEntry[]
}

export interface BopEntry {
  track: string
  carModel: number
  ballastKg: number
  restrictor: number
}

// 所有配置文件的集合
export interface AllConfigs {
  configuration: Configuration
  settings: Settings
  event: Event
  eventRules: EventRules
  assistRules: AssistRules
  entryList: EntryList
  bop: Bop
}
