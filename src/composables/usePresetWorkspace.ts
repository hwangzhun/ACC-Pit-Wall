import { computed, ref, type Ref } from 'vue'
import type { AllConfigs } from '../types/configuration'
import { normalizeSettings } from '../types/defaults'
import {
  deletePreset,
  getPresets,
  loadPreset,
  renamePreset,
  savePreset,
  updatePreset,
  type Preset,
  type PresetWithData
} from '../utils/presetManager'
import { cloneConfigs, configsEqual } from '../utils/configDiff'

function normalizeConfigs(configs: AllConfigs): AllConfigs {
  const copy = cloneConfigs(configs)
  copy.settings = normalizeSettings(copy.settings)
  return copy
}

export function usePresetWorkspace(configs: Ref<AllConfigs>) {
  const presets = ref<Preset[]>([])
  const activePresetName = ref<string | null>(null)
  const baseline = ref<AllConfigs>(cloneConfigs(configs.value))
  const selectedPresetName = ref<string | null>(null)
  const selectedPresetDetails = ref<PresetWithData | null>(null)
  const busy = ref(false)
  const detailLoading = ref(false)
  const detailsCache = new Map<string, PresetWithData>()

  const isDirty = computed(() => !configsEqual(configs.value, baseline.value))
  const sortedPresets = computed(() => [...presets.value].sort((left, right) => {
    if (left.name === activePresetName.value) return -1
    if (right.name === activePresetName.value) return 1
    return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
  }))

  async function runBusy<T>(action: () => Promise<T>): Promise<T> {
    if (busy.value) throw new Error('A preset operation is already running')
    busy.value = true
    try {
      return await action()
    } finally {
      busy.value = false
    }
  }

  async function refreshPresets() {
    presets.value = await getPresets()
    const knownNames = new Set(presets.value.map(preset => preset.name))
    for (const key of detailsCache.keys()) {
      if (!knownNames.has(key)) detailsCache.delete(key)
    }
    if (selectedPresetName.value && !knownNames.has(selectedPresetName.value)) {
      selectedPresetName.value = null
      selectedPresetDetails.value = null
    }
  }

  async function getDetails(name: string, force = false): Promise<PresetWithData> {
    const listItem = presets.value.find(preset => preset.name === name)
    const cacheKey = listItem ? `${name}:${listItem.updatedAt}` : name
    if (!force && detailsCache.has(cacheKey)) return detailsCache.get(cacheKey)!

    const loaded = await loadPreset(name)
    const normalized = { ...loaded, configs: normalizeConfigs(loaded.configs) }
    for (const key of detailsCache.keys()) {
      if (key === name || key.startsWith(`${name}:`)) detailsCache.delete(key)
    }
    detailsCache.set(cacheKey, normalized)
    return normalized
  }

  async function selectPreset(name: string | null) {
    selectedPresetName.value = name
    selectedPresetDetails.value = null
    if (!name) return

    detailLoading.value = true
    try {
      const details = await getDetails(name)
      if (selectedPresetName.value === name) selectedPresetDetails.value = details
    } finally {
      detailLoading.value = false
    }
  }

  async function applyPreset(name: string) {
    return runBusy(async () => {
      const details = await getDetails(name, true)
      configs.value = cloneConfigs(details.configs)
      activePresetName.value = name
      baseline.value = cloneConfigs(configs.value)
      selectedPresetName.value = name
      selectedPresetDetails.value = details
      return details
    })
  }

  async function saveAs(name: string, description: string) {
    return runBusy(async () => {
      const normalizedName = name.trim()
      await savePreset(normalizedName, description.trim(), cloneConfigs(configs.value))
      activePresetName.value = normalizedName
      baseline.value = cloneConfigs(configs.value)
      await refreshPresets()
      await selectPreset(normalizedName)
    })
  }

  async function updateActive() {
    if (!activePresetName.value) throw new Error('No active preset')
    const name = activePresetName.value
    return runBusy(async () => {
      await updatePreset(name, cloneConfigs(configs.value))
      baseline.value = cloneConfigs(configs.value)
      await refreshPresets()
      await selectPreset(name)
    })
  }

  async function restoreActive() {
    if (!activePresetName.value) throw new Error('No active preset')
    return applyPreset(activePresetName.value)
  }

  async function renameSelected(newName: string, description: string) {
    if (!selectedPresetName.value) throw new Error('No selected preset')
    const oldName = selectedPresetName.value
    const normalizedName = newName.trim()
    return runBusy(async () => {
      await renamePreset(oldName, normalizedName, description.trim())
      if (activePresetName.value === oldName) activePresetName.value = normalizedName
      detailsCache.clear()
      await refreshPresets()
      await selectPreset(normalizedName)
    })
  }

  async function deleteSelected() {
    if (!selectedPresetName.value) throw new Error('No selected preset')
    const name = selectedPresetName.value
    return runBusy(async () => {
      await deletePreset(name)
      if (activePresetName.value === name) {
        activePresetName.value = null
        baseline.value = cloneConfigs(configs.value)
      }
      selectedPresetName.value = null
      selectedPresetDetails.value = null
      detailsCache.clear()
      await refreshPresets()
    })
  }

  return {
    presets,
    sortedPresets,
    activePresetName,
    baseline,
    isDirty,
    selectedPresetName,
    selectedPresetDetails,
    busy,
    detailLoading,
    refreshPresets,
    selectPreset,
    applyPreset,
    saveAs,
    updateActive,
    restoreActive,
    renameSelected,
    deleteSelected
  }
}
