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
          @click="activeTab = item.id"
          :class="[
            'win11-sidebar-item',
            activeTab === item.id ? 'active' : ''
          ]"
        >
          <TechIcons :name="item.icon" />
          <span>{{ item.label }}</span>
        </div>
      </nav>

      <div class="win11-sidebar-footer">
        <div class="win11-card">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs text-win11-text-secondary">ACTIVE PRESET</span>
            <span class="win11-badge">{{ activePresetName || 'NONE' }}</span>
          </div>
          <PresetManager
            :configs="configs"
            :active-preset-name="activePresetName"
            @load="handleLoadPreset"
            @active-preset-change="onActivePresetChange"
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
            <BopContainer v-else-if="activeTab === 'bop'" v-model:bop="configs.bop" />
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
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
import { useDeployConnection } from '../composables/useDeployConnection'
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
import { useLanguage, useTheme, t, currentLanguage as languageRef } from '../i18n'
import logoImg from '../assets/logo.png'

const appVersion = __APP_VERSION__
const { currentLanguage, toggleLanguage } = useLanguage()
const { currentTheme, toggleTheme } = useTheme()
const { isConnected, connecting, connectionStatus, refreshStatus } = useDeployConnection()

function syncDocumentTitle() {
  const title = `${t('title.main')} v${appVersion}`
  document.title = title
  if (typeof window !== 'undefined' && window.__TAURI__) {
    void import('@tauri-apps/api/window').then(({ getCurrentWindow }) => {
      void getCurrentWindow().setTitle(title)
    })
  }
}

onMounted(async () => {
  syncDocumentTitle()
  await refreshStatus()
})

watch(languageRef, syncDocumentTitle)

const activeTab = ref('settings')
const activePresetName = ref<string | null>(null)

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

const currentNavTitle = computed(() => {
  const item = navItems.value.find(nav => nav.id === activeTab.value)
  return item?.label || ''
})

const currentNavDescription = computed(() => {
  const item = navItems.value.find(nav => nav.id === activeTab.value)
  return item?.description || ''
})

const configs = ref<AllConfigs>({
  settings: defaultSettings(),
  configuration: defaultConfiguration(),
  event: defaultEvent(),
  eventRules: defaultEventRules(),
  assistRules: defaultAssistRules(),
  entryList: defaultEntryList(),
  bop: defaultBop()
})

function handleLoadPreset(payload: { configs: AllConfigs; presetName: string }) {
  configs.value = JSON.parse(JSON.stringify(payload.configs))
  activePresetName.value = payload.presetName
}

function onActivePresetChange(name: string | null) {
  activePresetName.value = name
}
</script>

<style scoped>
.win11-app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  font-family: 'Segoe UI Variable', 'Segoe UI', system-ui, -apple-system, sans-serif;
  background: var(--win11-bg);
  border: none;
  box-shadow: none;
  border-radius: 0;
  overflow: hidden;
}

.win11-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.win11-sidebar {
  width: 16rem;
  display: flex;
  flex-direction: column;
  background: var(--win11-surface);
  border-right: 1px solid var(--win11-border);
  backdrop-filter: blur(20px);
}

.win11-sidebar-header {
  padding: 1rem;
  border-bottom: 1px solid var(--win11-border);
}

.win11-sidebar-nav {
  flex: 1;
  padding: 1rem 0;
}

.win11-sidebar-footer {
  padding: 1rem;
  border-top: 1px solid var(--win11-border);
}

.win11-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.win11-header {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid var(--win11-border);
  background: var(--win11-surface);
}

.win11-header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.win11-header-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--win11-text);
  margin-bottom: 0.25rem;
}

.win11-header-subtitle {
  font-size: 0.875rem;
  color: var(--win11-text-secondary);
}

.win11-content {
  flex: 1;
  overflow: auto;
  padding: 2rem;
  background: var(--win11-bg);
}

.win11-footer {
  padding: 0.75rem 2rem;
  border-top: 1px solid var(--win11-border);
  background: var(--win11-surface);
}

.win11-button {
  height: 2.25rem;
  padding: 0 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  font-size: 0.875rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.15s;
  cursor: pointer;
  border: none;
}

.win11-button.secondary {
  background: var(--win11-control-bg);
  color: var(--win11-text);
}

.win11-button.secondary:hover {
  background: var(--win11-control-hover-bg);
}

.win11-card {
  background: var(--win11-surface);
  border-radius: 0.5rem;
  padding: 1rem;
  border: var(--win11-card-border);
  box-shadow: var(--win11-card-shadow);
}

.win11-badge {
  display: inline-flex;
  align-items: center;
  padding: 0 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  background: var(--win11-control-bg);
  color: var(--win11-text-secondary);
  border-radius: 0.25rem;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.animate-in {
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
