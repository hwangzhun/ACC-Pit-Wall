<template>
  <div class="json-preview">
    <Win11Card>
      <template #title>
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-md bg-win11-accent/10 flex items-center justify-center">
            <svg class="w-5 h-5 text-win11-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
          <div>
            <h3 class="text-base font-semibold text-win11-text m-0">{{ t('nav.jsonPreview') }}</h3>
            <p class="text-xs text-win11-text-secondary m-0">{{ t('previewPage.subtitle') }}</p>
          </div>
        </div>
      </template>

      <div class="space-y-6">
        <div class="win11-tabs">
          <button
            v-for="fileName in configFiles"
            :key="fileName"
            class="win11-tab"
            :class="{ active: activeFile === fileName }"
            @click="activeFile = fileName"
          >
            {{ fileName }}
          </button>
        </div>

        <div class="preview-meta summary-cards">
          <div><span>{{ t('previewPage.currentFile') }}</span><strong>{{ activeFile }}</strong></div>
          <div><span>{{ t('previewPage.lines') }}</span><strong>{{ jsonLineCount }}</strong></div>
          <div><span>{{ t('previewPage.size') }}</span><strong>{{ jsonSize }}</strong></div>
          <div><span>{{ t('previewPage.status') }}</span><strong class="valid">{{ t('previewPage.validJson') }}</strong></div>
        </div>
        <div class="win11-json-container">
          <pre class="win11-json-content">{{ getJsonContent(activeFile) }}</pre>
        </div>

        <div class="flex gap-2">
          <Win11Button variant="primary" @click="downloadSingleFile(activeFile)">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {{ t('previewPage.download') }} {{ activeFile }}
          </Win11Button>
          <Win11Button variant="secondary" @click="copyToClipboard(activeFile)">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
            {{ copied ? t('previewPage.copied') : t('previewPage.copy') }}
          </Win11Button>
        </div>
      </div>
    </Win11Card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { AllConfigs } from '../types/configuration'
import { downloadSingleConfig } from '../utils/configManager'
import { t } from '../i18n'
import { Win11Card, Win11Button } from '../components/win11'

const props = defineProps<{
  configs: AllConfigs
}>()

const activeFile = ref('settings.json')
const copied = ref(false)
const configFiles = [
  'configuration.json',
  'settings.json',
  'event.json',
  'eventRules.json',
  'assistRules.json',
  'entrylist.json',
  'bop.json'
]

const fileNameToKey: Record<string, keyof AllConfigs> = {
  'configuration.json': 'configuration',
  'settings.json': 'settings',
  'event.json': 'event',
  'eventRules.json': 'eventRules',
  'assistRules.json': 'assistRules',
  'entrylist.json': 'entryList',
  'bop.json': 'bop'
}

const activeJson = computed(() => getJsonContent(activeFile.value))
const jsonLineCount = computed(() => activeJson.value.split('\n').length)
const jsonSize = computed(() => {
  const bytes = new Blob([activeJson.value]).size
  return bytes < 1024 ? String(bytes) + ' B' : (bytes / 1024).toFixed(1) + ' KB'
})

function getJsonContent(fileName: string): string {
  const key = fileNameToKey[fileName]
  return JSON.stringify(props.configs[key], null, 2)
}

async function downloadSingleFile(fileName: string) {
  const key = fileNameToKey[fileName]
  try {
    await downloadSingleConfig(fileName, props.configs[key])
  } catch (error) {
    console.error('Download failed:', error)
  }
}

function copyToClipboard(fileName: string) {
  const content = getJsonContent(fileName)
  navigator.clipboard.writeText(content).then(() => {
    copied.value = true
    window.setTimeout(() => { copied.value = false }, 1600)
  }).catch(err => {
    console.error('Copy failed:', err)
  })
}
</script>

<style scoped>
.preview-meta{display:grid;grid-template-columns:1.4fr repeat(3,.7fr);gap:8px}.preview-meta>div{padding:9px 11px;border:1px solid var(--win11-border);border-radius:8px;background:var(--win11-control-bg)}.preview-meta span{display:block;font-size: var(--type-caption);color:var(--win11-text-secondary)}.preview-meta strong{display:block;margin-top:2px;font-size: var(--type-caption);color:var(--win11-text)}.preview-meta .valid{color:#258c5b}.win11-tabs{overflow-x:auto}.win11-tab{flex:none}@media(max-width:650px){.preview-meta{grid-template-columns:1fr 1fr}}
.win11-tabs {
  @apply flex gap-1 p-1 rounded-lg;
  @apply bg-win11-control-bg;
}

.win11-tab {
  @apply px-4 py-2 rounded-md text-sm font-medium;
  @apply text-win11-text-secondary;
  @apply transition-all duration-200;
}

.win11-tab:hover {
  @apply text-win11-text bg-win11-surface-hover;
}

.win11-tab.active {
  @apply text-win11-text bg-win11-surface;
  @apply shadow-sm;
}

.win11-json-container {
  @apply p-4 rounded-lg overflow-auto;
  @apply bg-win11-control-bg border border-win11-border;
  max-height: 500px;
}

.win11-json-content {
  @apply text-sm text-win11-text font-mono leading-relaxed;
  @apply whitespace-pre-wrap;
}
</style>
