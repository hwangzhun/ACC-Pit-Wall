import type { EntryList, Entry, Driver } from '../types/configuration'
import { isValidSteamId, normalizeSteamId, steamIdsEqual } from './steamId'

export interface ParseResult {
  success: boolean
  entryList: EntryList
  errors: string[]
  warnings: string[]
}

export interface CSVRow {
  playerID: string
  teamName: string
  raceNumber: string
  defaultGridPosition: string
  firstName: string
  lastName: string
  shortName: string
  overrideDriverInfo: string
  isServerAdmin: string
  nationality: string
  driverCategory: string
  forcedCarModel: string
  ballastK: string
  restrictor: string
}

const DRIVER_CATEGORY_MAP: Record<string, number> = {
  '青铜': 0,
  '白银': 1,
  '黄金': 2,
  '白金': 3,
  '精英': 4,
  '0': 0,
  '1': 1,
  '2': 2,
  '3': 3,
  '4': 4
}

const CAR_MODEL_MAP: Record<string, number> = {
  '保时捷911 GT3 R (2019)': 82,
  '法拉利 488 GT3 2018': 3,
  '兰博基尼 Huracan GT3 EVO': 4,
  '奥迪 R8 LMS EVO II': 5,
  '迈凯伦 720S GT3': 6,
  '阿斯顿马丁 V8 Vantage GT3': 7,
  '宝马 M6 GT3': 9,
  '奔驰AMG GT3': 10,
  '日产 GT-R NISMO GT3 2018': 12,
  '本田 NSX GT3': 14,
  '科尔维特 C7.R': 15,
  '雷克萨斯 RC F GT3': 16,
  '宝马 M4 GT3': 56
}

function parseNumber(value: string, defaultValue: number = 0): number {
  const parsed = parseInt(value.trim(), 10)
  return isNaN(parsed) ? defaultValue : parsed
}

function parseDriverCategory(value: string): number {
  const trimmed = value.trim()
  return DRIVER_CATEGORY_MAP[trimmed] ?? parseInt(trimmed, 10) ?? 0
}

function parseCarModel(value: string): number {
  const trimmed = value.trim()
  return CAR_MODEL_MAP[trimmed] ?? parseInt(trimmed, 10) ?? -1
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === '\t' && !inQuotes) {
      result.push(current)
      current = ''
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  result.push(current)

  return result
}

function parseCSVRow(columns: string[]): CSVRow | null {
  if (columns.length < 13) {
    return null
  }

  return {
    playerID: columns[0]?.trim() || '',
    teamName: columns[1]?.trim() || '',
    raceNumber: columns[2]?.trim() || '0',
    defaultGridPosition: columns[3]?.trim() || '0',
    firstName: columns[4]?.trim() || '',
    lastName: columns[5]?.trim() || '',
    shortName: columns[6]?.trim() || '',
    overrideDriverInfo: columns[7]?.trim() || '1',
    isServerAdmin: columns[8]?.trim() || '0',
    nationality: columns[9]?.trim() || '0',
    driverCategory: columns[10]?.trim() || '0',
    forcedCarModel: columns[11]?.trim() || '-1',
    ballastK: columns[12]?.trim() || '0',
    restrictor: columns[13]?.trim() || '0'
  }
}

function createDriverFromCSV(row: CSVRow): Driver {
  const rawId = row.playerID?.trim() || ''
  return {
    driverCategory: parseDriverCategory(row.driverCategory),
    firstName: row.firstName,
    lastName: row.lastName,
    playerID: rawId ? normalizeSteamId(rawId) : '',
    shortName: row.shortName,
    nationality: parseNumber(row.nationality)
  }
}

function createEntryFromTeamKey(teamKey: string, rows: CSVRow[]): Entry {
  const firstRow = rows[0]
  
  return {
    teamName: teamKey,
    raceNumber: parseNumber(firstRow.raceNumber),
    defaultGridPosition: parseNumber(firstRow.defaultGridPosition),
    ballastKg: parseNumber(firstRow.ballastK),
    restrictor: parseNumber(firstRow.restrictor),
    isServerAdmin: parseNumber(firstRow.isServerAdmin, 0),
    forcedCarModel: parseCarModel(firstRow.forcedCarModel),
    overrideCarModelForCustomCar: 0,
    overrideDriverInfo: parseNumber(firstRow.overrideDriverInfo, 1),
    customCar: '',
    drivers: rows.map(createDriverFromCSV)
  }
}

export function parseCSV(content: string): ParseResult {
  const errors: string[] = []
  const warnings: string[] = []
  const entries: Entry[] = []
  const teamMap = new Map<string, CSVRow[]>()

  const lines = content.split('\n').filter(line => line.trim())

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const columns = parseCSVLine(line)
    const row = parseCSVRow(columns)

    if (!row) {
      if (i > 0) {
        errors.push(`第 ${i + 1} 行：数据列数不足，至少需要13列`)
      }
      continue
    }

    if (!row.firstName || !row.lastName) {
      warnings.push(`第 ${i + 1} 行：车手姓名不完整`)
      continue
    }

    if (!row.teamName) {
      warnings.push(`第 ${i + 1} 行：车队名称为空，跳过`)
      continue
    }

    if (row.playerID.trim() && !isValidSteamId(row.playerID)) {
      warnings.push(
        `第 ${i + 1} 行：SteamID 无效（须为 17 位数字，可带 S 前缀），请在名单中修正：${row.playerID}`
      )
    }

    if (!teamMap.has(row.teamName)) {
      teamMap.set(row.teamName, [])
    }
    teamMap.get(row.teamName)!.push(row)
  }

  teamMap.forEach((rows, teamName) => {
    const entry = createEntryFromTeamKey(teamName, rows)
    entries.push(entry)
  })

  return {
    success: errors.length === 0,
    entryList: {
      entries,
      forceEntryList: 0
    },
    errors,
    warnings
  }
}

export function mergeEntryLists(current: EntryList, parsed: EntryList): EntryList {
  const teamMap = new Map<string, Entry>()

  current.entries.forEach(entry => {
    if (entry.teamName) {
      teamMap.set(entry.teamName, entry)
    }
  })

  parsed.entries.forEach(entry => {
    if (entry.teamName && teamMap.has(entry.teamName)) {
      const existing = teamMap.get(entry.teamName)!
      entry.drivers.forEach(driver => {
        const exists = existing.drivers.some(
          d =>
            steamIdsEqual(d.playerID, driver.playerID) ||
            (d.firstName === driver.firstName && d.lastName === driver.lastName)
        )
        if (!exists) {
          existing.drivers.push(driver)
        }
      })
    } else if (entry.teamName) {
      teamMap.set(entry.teamName, entry)
    }
  })

  return {
    entries: Array.from(teamMap.values()),
    forceEntryList: current.forceEntryList ?? 0,
  }
}
