<template>
  <div class="json-preview">
    <el-tabs v-model="activeFile">
      <el-tab-pane
        v-for="fileName in configFiles"
        :key="fileName"
        :label="fileName"
        :name="fileName"
      >
        <el-input
          :model-value="getJsonContent(fileName)"
          type="textarea"
          :rows="20"
          readonly
        />
        <el-button
          type="primary"
          :icon="Download"
          style="margin-top: 12px"
          @click="downloadSingleFile(fileName)"
        >
          {{ t('common.download') }} {{ fileName }}
        </el-button>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Download } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { AllConfigs } from '../types/configuration'
import { downloadSingleConfig } from '../utils/configManager'
import { t } from '../i18n'

const props = defineProps<{
  configs: AllConfigs
}>()

const activeFile = ref('settings.json')
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

function getJsonContent(fileName: string): string {
  const key = fileNameToKey[fileName]
  return JSON.stringify(props.configs[key], null, 2)
}

async function downloadSingleFile(fileName: string) {
  const key = fileNameToKey[fileName]
  try {
    await downloadSingleConfig(fileName, props.configs[key])
    ElMessage.success(t('message.downloadSuccess'))
  } catch (error) {
    ElMessage.error(t('message.downloadFailed') + ': ' + (error as Error).message)
  }
}
</script>

<style scoped>
.json-preview {
  padding: 0;
}
</style>
