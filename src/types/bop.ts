// BOP 相关类型定义

export interface Bop {
  entries: BopEntry[]
}

export interface BopEntry {
  track: string
  carModel: number
  ballastKg: number
  restrictor: number
}

export interface BopFilter {
  track: string | 'all'
  carClass: 'all' | 'GT3' | 'GT4' | 'GT2'
  searchKeyword: string
}

export interface BopSort {
  field: 'carModel' | 'ballastKg' | 'restrictor'
  order: 'asc' | 'desc'
}
