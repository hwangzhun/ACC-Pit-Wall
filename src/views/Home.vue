<template>
  <div class="home">
    <el-container>
      <el-header class="header">
        <h1 class="title-with-version">
          {{ t('title.main') }}
          <span class="app-version">v{{ appVersion }}</span>
        </h1>
        <div class="actions">
          <div v-if="activePresetName" class="current-preset">
            <span class="current-preset-label">{{ t('preset.currentPresetBanner') }}</span>
            <el-tag type="success" effect="dark" size="default">{{ activePresetName }}</el-tag>
          </div>
          <div v-else class="current-preset current-preset--empty">
            <span class="current-preset-hint">{{ t('preset.editingWithoutPreset') }}</span>
          </div>
          <PresetManager
            :configs="configs"
            :active-preset-name="activePresetName"
            @load="handleLoadPreset"
            @active-preset-change="onActivePresetChange"
          />
          <el-divider direction="vertical" />
          <el-button @click="toggleLanguage">
            {{ currentLanguage === 'zh' ? 'EN' : '中文' }}
          </el-button>
        </div>
      </el-header>

      <el-main>
        <el-tabs v-model="activeTab" type="border-card">
          <el-tab-pane :label="t('nav.settings')" name="settings">
            <SettingsForm :settings="configs.settings" />
          </el-tab-pane>

          <el-tab-pane :label="t('nav.configuration')" name="configuration">
            <ConfigurationForm :configuration="configs.configuration" />
          </el-tab-pane>

          <el-tab-pane :label="t('nav.event')" name="event">
            <EventForm :event="configs.event" />
          </el-tab-pane>

          <el-tab-pane :label="t('nav.eventRules')" name="eventRules">
            <EventRulesForm :eventRules="configs.eventRules" />
          </el-tab-pane>

          <el-tab-pane :label="t('nav.assistRules')" name="assistRules">
            <AssistRulesForm :assistRules="configs.assistRules" />
          </el-tab-pane>

          <el-tab-pane :label="t('nav.entryList')" name="entryList">
            <EntryListForm :entryList="configs.entryList" />
          </el-tab-pane>

          <el-tab-pane :label="t('nav.bop')" name="bop" class="bop-tab-pane">
            <BopForm v-model:bop="configs.bop" />
          </el-tab-pane>

          <el-tab-pane :label="t('nav.deploy')" name="deploy">
            <DeployForm :configs="configs" />
          </el-tab-pane>

          <el-tab-pane :label="t('nav.jsonPreview')" name="preview">
            <JsonPreview :configs="configs" />
          </el-tab-pane>

          <el-tab-pane :label="t('nav.about')" name="about">
            <About />
          </el-tab-pane>
        </el-tabs>
      </el-main>

      <el-footer class="footer">
        <span class="footer-version">v{{ appVersion }}</span>
      </el-footer>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import SettingsForm from '../components/SettingsForm.vue'
import ConfigurationForm from '../components/ConfigurationForm.vue'
import EventForm from '../components/EventForm.vue'
import EventRulesForm from '../components/EventRulesForm.vue'
import AssistRulesForm from '../components/AssistRulesForm.vue'
import EntryListForm from '../components/EntryListForm.vue'
import BopForm from '../components/bop/BopContainer.vue'
import DeployForm from './DeployForm.vue'
import JsonPreview from './JsonPreview.vue'
import About from './About.vue'
import PresetManager from '../components/PresetManager.vue'
import { normalizeEntryList } from '../utils/normalizeEntryList'
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
import { useLanguage, t, currentLanguage as languageRef } from '../i18n'

const appVersion = __APP_VERSION__

const { currentLanguage, toggleLanguage } = useLanguage()

function syncDocumentTitle() {
  const title = `${t('title.main')} v${appVersion}`
  document.title = title
  if (typeof window !== 'undefined' && window.__TAURI__) {
    void import('@tauri-apps/api/window').then(({ getCurrentWindow }) => {
      void getCurrentWindow().setTitle(title)
    })
  }
}

onMounted(syncDocumentTitle)
watch(languageRef, syncDocumentTitle)

const activeTab = ref('settings')
/** 最近一次通过「加载选中预设」载入的预设名；手动编辑不会自动清除 */
const activePresetName = ref<string | null>(null)

const configs = ref<AllConfigs>({
  configuration: { ...defaultConfiguration },
  settings: { ...defaultSettings },
  event: { ...defaultEvent, sessions: [...defaultEvent.sessions] },
  eventRules: { ...defaultEventRules },
  assistRules: { ...defaultAssistRules },
  entryList: { ...defaultEntryList, entries: [] },
  bop: { ...defaultBop, entries: [] }
})

function onActivePresetChange(name: string | null) {
  activePresetName.value = name
}

function handleLoadPreset(payload: { configs: AllConfigs; presetName: string }) {
  const loadedConfigs = payload.configs
  configs.value = {
    configuration: { ...loadedConfigs.configuration },
    settings: { ...loadedConfigs.settings },
    event: {
      ...loadedConfigs.event,
      sessions: [...loadedConfigs.event.sessions]
    },
    eventRules: { ...loadedConfigs.eventRules },
    assistRules: { ...loadedConfigs.assistRules },
    entryList: normalizeEntryList({
      ...loadedConfigs.entryList,
      entries: [...(loadedConfigs.entryList.entries ?? [])],
    }),
    bop: {
      ...loadedConfigs.bop,
      entries: [...loadedConfigs.bop.entries]
    }
  }
  activePresetName.value = payload.presetName
}
</script>

<style scoped>
.home {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 0 20px;
}

.title-with-version {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
}

.header h1 {
  margin: 0;
  font-size: 24px;
}

.app-version {
  font-size: 14px;
  font-weight: 500;
  color: #909399;
  letter-spacing: 0.02em;
}

.footer {
  height: auto !important;
  padding: 12px 20px !important;
  background-color: #fff;
  border-top: 1px solid #ebeef5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.footer-version {
  font-size: 12px;
  color: #909399;
}

.home :deep(.el-container) {
  min-height: 100vh;
}

.actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.current-preset {
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: 280px;
}

.current-preset-label {
  font-size: 13px;
  color: #606266;
  white-space: nowrap;
}

.current-preset :deep(.el-tag) {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.current-preset--empty .current-preset-hint {
  font-size: 13px;
  color: #909399;
  white-space: nowrap;
}

.home .el-main {
  flex: 1;
  padding: 20px;
}

:deep(.el-tabs__content) {
  padding: 20px;
}

/* BOP设置标签页样式 */
:deep(.bop-tab-pane) {
  height: calc(100vh - 200px);
  min-height: 500px;
}

:deep(.bop-tab-pane .el-tab-pane__content) {
  height: 100%;
}
</style>
