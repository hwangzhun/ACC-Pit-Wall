import { ref, computed, provide, inject, type InjectionKey, type Ref } from 'vue'
import type { Bop, BopEntry } from '../../../types/bop'

export interface BopFilter {
  track: string | 'all'
  carClass: 'all' | 'GT3' | 'GT4' | 'GT2'
  searchKeyword: string
}

export interface BopSort {
  field: 'carModel' | 'ballastKg' | 'restrictor'
  order: 'asc' | 'desc'
}

export interface BopState {
  entries: Ref<BopEntry[]>
  selectedTrack: Ref<string | 'all'>
  selectedEntryIds: Ref<Set<number>>
  editingEntry: Ref<BopEntry | null>
  editingIndex: Ref<number | null>
  filter: Ref<BopFilter>
  sort: Ref<BopSort>
}

const BopStateKey: InjectionKey<BopState> = Symbol('BopState')

export function useBopStateProvider(bop: Ref<Bop>) {
  const entries = computed({
    get: () => bop.value.entries,
    set: (val) => { bop.value.entries = val }
  })

  const selectedTrack = ref<string | 'all'>('all')
  const selectedEntryIds = ref<Set<number>>(new Set())
  const editingEntry = ref<BopEntry | null>(null)
  const editingIndex = ref<number | null>(null)

  const filter = ref<BopFilter>({
    track: 'all',
    carClass: 'all',
    searchKeyword: ''
  })

  const sort = ref<BopSort>({
    field: 'carModel',
    order: 'asc'
  })

  const state: BopState = {
    entries,
    selectedTrack,
    selectedEntryIds,
    editingEntry,
    editingIndex,
    filter,
    sort
  }

  provide(BopStateKey, state)

  return state
}

export function useBopState(): BopState {
  const state = inject(BopStateKey)
  if (!state) {
    throw new Error('useBopState must be used within a BopState provider')
  }
  return state
}
