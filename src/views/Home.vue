<template>
  <div class="win11-app">
    <TitleBar />
    <div class="win11-body">
      <aside class="win11-sidebar">
        <div class="win11-sidebar-header">
          <div class="flex items-center gap-3 mb-2">
            <img :src="logoImg" alt="Logo" class="h-10 w-10 object-contain" />
            <div>
              <h1 class="text-base font-semibold text-win11-text m-0">{{ t('title.main') }}</h1>
              <span class="text-xs text-win11-text-secondary font-mono">v{{ appVersion }}</span>
            </div>
          </div>
        </div>

        <nav class="win11-sidebar-nav">
          <div
            v-for="item in navItems"
            :key="item.id"
            :class="['win11-sidebar-item', activeTab === item.id ? 'active' : '']"
            @click="activeTab = item.id"
          >
            <TechIcons :name="item.icon" />
            <span>{{ item.label }}</span>
          </div>
        </nav>

        <div class="win11-sidebar-footer">
          <div class="win11-card">
            <PresetQuickPanel
              :presets="sortedPresets"
              :active-preset-name="activePresetName"
              :is-dirty="isDirty"
              :busy="busy"
              @select="requestApplyPreset"
              @save-active="openUpdateConfirm"
              @save-as="openSaveAs"
              @manage="managerVisible = true"
            />
          </div>
        </div>
      </aside>

      <main class="win11-main">
        <header class="win11-header">
          <div class="win11-header-content">
            <div>
              <h2 class="win11-header-title">{{ currentNavTitle }}</h2>
              <p class="win11-header-subtitle">{{ currentNavDescription }}</p>
            </div>
            <div class="flex items-center gap-3">
              <div
                v-if="isConnected || connecting"
                class="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium"
                :class="connecting ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'"
                :title="connecting ? 'SSH connecting...' : `SSH: ${connectionStatus?.host}`"
              >
                <span class="w-1.5 h-1.5 rounded-full" :class="connecting ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'" />
                {{ connecting ? 'Connecting' : 'SSH' }}
              </div>
              <button @click="toggleTheme" class="win11-button secondary">
                <svg v-if="currentTheme === 'dark'" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              </button>
              <button @click="toggleLanguage" class="win11-button secondary">
                {{ currentLanguage === 'zh' ? 'EN' : '中文' }}
              </button>
            </div>
          </div>
        </header>

        <div class="win11-content">
          <Transition name="fade" mode="out-in">
            <div :key="activeTab" class="animate-in">
              <SettingsForm v-if="activeTab === 'settings'" :settings="configs.settings" />
              <ConfigurationForm v-else-if="activeTab === 'configuration'" :configuration="configs.configuration" />
              <EventForm v-else-if="activeTab === 'event'" :event="configs.event" />
              <EventRulesForm v-else-if="activeTab === 'eventRules'" :eventRules="configs.eventRules" />
              <AssistRulesForm v-else-if="activeTab === 'assistRules'" :assistRules="configs.assistRules" />
              <EntryListForm v-else-if="activeTab === 'entryList'" :entryList="configs.entryList" />
              <BopContainer v-else-if="activeTab === 'bop'" v-model:bop="configs.bop" :current-track="configs.event.track" />
              <DeployForm v-else-if="activeTab === 'deploy'" v-model:configs="configs" />
              <JsonPreview v-else-if="activeTab === 'preview'" :configs="configs" />
              <About v-else-if="activeTab === 'about'" />
            </div>
          </Transition>
        </div>

        <footer class="win11-footer">
          <div class="flex items-center justify-between text-xs text-win11-text-secondary">
            <span>ACC PITWALL</span>
            <span class="font-mono">{{ new Date().toLocaleTimeString() }}</span>
          </div>
        </footer>
      </main>
    </div>

    <PresetManager
      v-model="managerVisible"
      :presets="sortedPresets"
      :configs="configs"
      :active-preset-name="activePresetName"
      :selected-preset-name="selectedPresetName"
      :selected-preset-details="selectedPresetDetails"
      :is-dirty="isDirty"
      :busy="busy"
      :detail-loading="detailLoading"
      @refresh="refreshPresetList"
      @select="handleSelectPreset"
      @apply="requestApplyPreset"
      @save-as="openSaveAs"
      @update-active="openUpdateConfirm"
      @restore-active="restoreConfirmVisible = true"
      @rename="handleRenamePreset"
      @delete="handleDeletePreset"
    />

    <PresetSaveDialog v-model="saveDialogVisible" :configs="configs" :busy="busy" @save="handleSaveAs" />
    <PresetSwitchGuardDialog
      v-model="switchGuardVisible"
      :has-active-preset="Boolean(activePresetName)"
      :target-name="pendingSwitchName || ''"
      :busy="busy"
      @save-switch="saveThenSwitch"
      @discard-switch="discardThenSwitch"
      @cancel="cancelSwitch"
    />

    <Win11Dialog v-model="updateConfirmVisible" :title="t('preset.updateDialogTitle')" width="min(620px, calc(100vw - 32px))" :z-index="3150">
      <PresetDiffPanel :diff="updateDiff" :title="t('preset.savedToCurrent')" />
      <template #footer>
        <Win11Button variant="secondary" :disabled="busy" @click="updateConfirmVisible = false">{{ t('common.cancel') }}</Win11Button>
        <Win11Button variant="primary" :loading="busy" @click="confirmUpdateActive">{{ t('preset.saveChanges') }}</Win11Button>
      </template>
    </Win11Dialog>

    <Win11Dialog v-model="restoreConfirmVisible" :title="t('preset.restoreDialogTitle')" width="min(500px, calc(100vw - 32px))" :z-index="3150">
      <p class="dialog-copy">{{ t('preset.restoreConfirm').replace('{name}', activePresetName || '') }}</p>
      <template #footer>
        <Win11Button variant="secondary" :disabled="busy" @click="restoreConfirmVisible = false">{{ t('common.cancel') }}</Win11Button>
        <Win11Button variant="danger" :loading="busy" @click="confirmRestoreActive">{{ t('preset.restoreSaved') }}</Win11Button>
      </template>
    </Win11Dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import TechIcons from '../components/TechIcons.vue'
import TitleBar from '../components/TitleBar.vue'
import SettingsForm from '../components/SettingsForm.vue'
import ConfigurationForm from '../components/ConfigurationForm.vue'
import EventForm from '../components/EventForm.vue'
import EventRulesForm from '../components/EventRulesForm.vue'
import AssistRulesForm from '../components/AssistRulesForm.vue'
import EntryListForm from '../components/EntryListForm.vue'
import BopContainer from '../components/bop/BopContainer.vue'
import DeployForm from './DeployForm.vue'
import JsonPreview from './JsonPreview.vue'
import About from './About.vue'
import PresetManager from '../components/PresetManager.vue'
import PresetQuickPanel from '../components/preset/PresetQuickPanel.vue'
import PresetSaveDialog from '../components/preset/PresetSaveDialog.vue'
import PresetSwitchGuardDialog from '../components/preset/PresetSwitchGuardDialog.vue'
import PresetDiffPanel from '../components/preset/PresetDiffPanel.vue'
import { Win11Button, Win11Dialog, notify } from '../components/win11'
import { useDeployConnection } from '../composables/useDeployConnection'
import { usePresetWorkspace } from '../composables/usePresetWorkspace'
import type { AllConfigs } from '../types/configuration'
import {
  defaultConfiguration,
  defaultSettings,
  defaultEvent,
  defaultEventRules,
  defaultAssistRules,
  defaultEntryList,
  defaultBop
} from '../types/defaults'
import { buildConfigDiff } from '../utils/configDiff'
import { useLanguage, useTheme, t, currentLanguage as languageRef } from '../i18n'
import logoImg from '../assets/logo.png'

const appVersion = __APP_VERSION__
const { currentLanguage, toggleLanguage } = useLanguage()
const { currentTheme, toggleTheme } = useTheme()
const { isConnected, connecting, connectionStatus, refreshStatus } = useDeployConnection()

const activeTab = ref('settings')
const configs = ref<AllConfigs>({
  settings: defaultSettings(),
  configuration: defaultConfiguration(),
  event: defaultEvent(),
  eventRules: defaultEventRules(),
  assistRules: defaultAssistRules(),
  entryList: defaultEntryList(),
  bop: defaultBop()
})

const workspace = usePresetWorkspace(configs)
const {
  sortedPresets,
  activePresetName,
  baseline,
  isDirty,
  selectedPresetName,
  selectedPresetDetails,
  busy,
  detailLoading
} = workspace

const managerVisible = ref(false)
const saveDialogVisible = ref(false)
const switchGuardVisible = ref(false)
const updateConfirmVisible = ref(false)
const restoreConfirmVisible = ref(false)
const pendingSwitchName = ref<string | null>(null)
const saveBeforeSwitch = ref(false)

const updateDiff = computed(() => buildConfigDiff(baseline.value, configs.value))

const navItems = computed(() => [
  { id: 'settings', label: t('nav.settings'), icon: 'SettingsIcon', description: 'Server Configuration' },
  { id: 'configuration', label: t('nav.configuration'), icon: 'NetworkIcon', description: 'Network Settings' },
  { id: 'event', label: t('nav.event'), icon: 'EventIcon', description: 'Track & Weather' },
  { id: 'eventRules', label: t('nav.eventRules'), icon: 'RulesIcon', description: 'Race Rules' },
  { id: 'assistRules', label: t('nav.assistRules'), icon: 'AssistIcon', description: 'Driving Aids' },
  { id: 'entryList', label: t('nav.entryList'), icon: 'GridIcon', description: 'Grid Management' },
  { id: 'bop', label: t('nav.bop'), icon: 'BalanceIcon', description: 'Balance of Performance' },
  { id: 'deploy', label: t('nav.deploy'), icon: 'RocketIcon', description: 'Deploy to Server' },
  { id: 'preview', label: t('nav.jsonPreview'), icon: 'CodeIcon', description: 'JSON Output' },
  { id: 'about', label: t('nav.about'), icon: 'InfoIcon', description: 'Application Info' }
])

const currentNavTitle = computed(() => navItems.value.find(nav => nav.id === activeTab.value)?.label || '')
const currentNavDescription = computed(() => navItems.value.find(nav => nav.id === activeTab.value)?.description || '')

function syncDocumentTitle() {
  const title = `${t('title.main')} v${appVersion}`
  document.title = title
  if (typeof window !== 'undefined' && window.__TAURI__) {
    void import('@tauri-apps/api/window').then(({ getCurrentWindow }) => void getCurrentWindow().setTitle(title))
  }
}

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  return typeof error === 'string' ? error : t('common.error')
}

async function refreshPresetList() {
  try {
    await workspace.refreshPresets()
  } catch (error) {
    notify.error(`${t('preset.errLoadList')}: ${errorMessage(error)}`)
  }
}

async function handleSelectPreset(name: string) {
  try {
    await workspace.selectPreset(name)
  } catch (error) {
    notify.error(`${t('preset.errLoad')}: ${errorMessage(error)}`)
  }
}

async function applyPreset(name: string) {
  try {
    await workspace.applyPreset(name)
    notify.success(t('preset.successLoaded'))
    managerVisible.value = false
    return true
  } catch (error) {
    notify.error(`${t('preset.errLoad')}: ${errorMessage(error)}`)
    return false
  }
}

async function requestApplyPreset(name: string) {
  if (!name || name === activePresetName.value && !isDirty.value) return
  if (isDirty.value) {
    pendingSwitchName.value = name
    switchGuardVisible.value = true
    return
  }
  await applyPreset(name)
}

function cancelSwitch() {
  switchGuardVisible.value = false
  pendingSwitchName.value = null
}

async function discardThenSwitch() {
  const target = pendingSwitchName.value
  if (!target) return cancelSwitch()
  if (await applyPreset(target)) cancelSwitch()
}

async function saveThenSwitch() {
  if (!pendingSwitchName.value) return cancelSwitch()
  if (!activePresetName.value) {
    saveBeforeSwitch.value = true
    switchGuardVisible.value = false
    saveDialogVisible.value = true
    return
  }

  try {
    await workspace.updateActive()
    const target = pendingSwitchName.value
    if (target && await applyPreset(target)) cancelSwitch()
  } catch (error) {
    notify.error(`${t('preset.errUpdate')}: ${errorMessage(error)}`)
  }
}

function openSaveAs() {
  saveBeforeSwitch.value = false
  saveDialogVisible.value = true
}

async function handleSaveAs(payload: { name: string; description: string }) {
  try {
    await workspace.saveAs(payload.name, payload.description)
    notify.success(t('preset.successSaved'))
    saveDialogVisible.value = false
    if (saveBeforeSwitch.value && pendingSwitchName.value) {
      const target = pendingSwitchName.value
      saveBeforeSwitch.value = false
      if (await applyPreset(target)) cancelSwitch()
    }
  } catch (error) {
    notify.error(`${t('preset.errSave')}: ${errorMessage(error)}`)
  }
}

function openUpdateConfirm() {
  if (activePresetName.value && isDirty.value) updateConfirmVisible.value = true
}

async function confirmUpdateActive() {
  try {
    await workspace.updateActive()
    updateConfirmVisible.value = false
    notify.success(t('preset.successUpdated'))
  } catch (error) {
    notify.error(`${t('preset.errUpdate')}: ${errorMessage(error)}`)
  }
}

async function confirmRestoreActive() {
  try {
    await workspace.restoreActive()
    restoreConfirmVisible.value = false
    notify.success(t('preset.successRestored'))
  } catch (error) {
    notify.error(`${t('preset.errRestore')}: ${errorMessage(error)}`)
  }
}

async function handleRenamePreset(payload: { name: string; description: string }) {
  try {
    await workspace.renameSelected(payload.name, payload.description)
    notify.success(t('preset.successRenamed'))
  } catch (error) {
    notify.error(`${t('preset.errRename')}: ${errorMessage(error)}`)
  }
}

async function handleDeletePreset() {
  const name = selectedPresetName.value
  if (!name) return
  const confirmed = await notify.confirm({
    title: t('preset.deleteDialogTitle'),
    message: t('preset.confirmDelete').replace('{name}', name),
    confirmText: t('common.delete'),
    cancelText: t('common.cancel'),
    type: 'warning'
  })
  if (!confirmed) return

  try {
    await workspace.deleteSelected()
    notify.success(t('preset.successDeleted'))
  } catch (error) {
    notify.error(`${t('preset.errDelete')}: ${errorMessage(error)}`)
  }
}

onMounted(async () => {
  syncDocumentTitle()
  await Promise.all([refreshStatus(), refreshPresetList()])
})

watch(languageRef, syncDocumentTitle)
</script>

<style scoped>
.win11-app{display:flex;flex-direction:column;height:100vh;font-family:'Segoe UI Variable','Segoe UI',system-ui,-apple-system,sans-serif;background:var(--win11-bg);border:none;box-shadow:none;border-radius:0;overflow:hidden}.win11-body{display:flex;flex:1;overflow:hidden}.win11-sidebar{width:16rem;display:flex;flex-direction:column;background:var(--win11-surface);border-right:1px solid var(--win11-border);backdrop-filter:blur(20px)}.win11-sidebar-header{padding:1rem;border-bottom:1px solid var(--win11-border)}.win11-sidebar-nav{flex:1;padding:1rem 0}.win11-sidebar-footer{padding:1rem;border-top:1px solid var(--win11-border)}.win11-main{flex:1;display:flex;flex-direction:column;overflow:hidden}.win11-header{padding:1.5rem 2rem;border-bottom:1px solid var(--win11-border);background:var(--win11-surface)}.win11-header-content{display:flex;align-items:center;justify-content:space-between}.win11-header-title{font-size:var(--type-page);font-weight:var(--weight-emphasis);color:var(--win11-text);margin-bottom:.25rem}.win11-header-subtitle{font-size:var(--type-body);color:var(--win11-text-secondary)}.win11-content{flex:1;overflow:auto;padding:2rem;background:var(--win11-bg)}.win11-footer{padding:.75rem 2rem;border-top:1px solid var(--win11-border);background:var(--win11-surface)}.win11-button{height:2.25rem;padding:0 1rem;border-radius:.375rem;font-weight:var(--weight-emphasis);font-size:var(--type-body);display:inline-flex;align-items:center;justify-content:center;gap:.5rem;transition:all .15s;cursor:pointer;border:none}.win11-button.secondary{background:var(--win11-control-bg);color:var(--win11-text)}.win11-button.secondary:hover{background:var(--win11-control-hover-bg)}.win11-card{background:var(--win11-surface);border-radius:.5rem;padding:.85rem;border:var(--win11-card-border);box-shadow:var(--win11-card-shadow)}.dialog-copy{margin:0;line-height:1.6;color:var(--win11-text-secondary)}.fade-enter-active,.fade-leave-active{transition:opacity .2s ease}.fade-enter-from,.fade-leave-to{opacity:0}.animate-in{animation:fadeIn .2s ease-out}@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
</style>
