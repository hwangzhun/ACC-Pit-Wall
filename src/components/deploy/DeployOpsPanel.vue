<template>
  <div class="win11-form-section">
    <h4 class="text-sm font-semibold text-win11-text mb-4">{{ t('deploy.deployOperations') }}</h4>
    <div class="flex gap-2 flex-wrap">
      <Win11Button
        variant="primary"
        :loading="uploadingConfig"
        :disabled="!isConnected || startingServer || stoppingServer || serverRunning"
        @click="handleUploadConfig"
      >
        {{ uploadingConfig ? configUploadStatus : t('deploy.uploadConfig') }}
      </Win11Button>

      <Win11Button
        variant="secondary"
        :loading="syncingConfig"
        :disabled="!isConnected || syncingConfig || uploadingConfig || startingServer || stoppingServer"
        @click="handlePullConfig"
      >
        {{ syncingConfig ? t('deploy.pullingConfig') : t('deploy.pullConfig') }}
      </Win11Button>

      <Win11Button
        variant="secondary"
        :loading="uploadingServer"
        :disabled="!isConnected || uploadingServer || uploadingConfig || startingServer || stoppingServer"
        @click="handleUploadServer"
      >
        {{ uploadingServer ? t('deploy.uploadingServer') : t('deploy.uploadServer') }}
      </Win11Button>

      <Win11Button
        variant="secondary"
        :loading="startingServer"
        :disabled="!isConnected || serverRunning"
        @click="handleStartServer"
      >
        {{ startingServer ? t('deploy.starting') : t('deploy.startServer') }}
      </Win11Button>

      <Win11Button
        variant="danger"
        :loading="stoppingServer"
        :disabled="!isConnected || !serverRunning"
        @click="handleStopServer"
      >
        {{ stoppingServer ? t('deploy.stopping') : t('deploy.stopServer') }}
      </Win11Button>

      <Win11Button
        variant="secondary"
        :loading="downloadingResults"
        :disabled="!isConnected || downloadingResults"
        @click="handleDownloadResults"
      >
        {{ downloadingResults ? t('deploy.downloading') : t('deploy.downloadResults') }}
      </Win11Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { t } from '../../i18n'
import { Win11Button } from '../win11'

defineProps<{
  isConnected: boolean
  uploadingConfig: boolean
  configUploadStatus: string
  startingServer: boolean
  stoppingServer: boolean
  downloadingResults: boolean
  serverRunning: boolean
  uploadingServer: boolean
  syncingConfig: boolean
}>()

const emit = defineEmits<{
  'upload': []
  'upload-server': []
  'start': []
  'stop': []
  'download': []
  'pull': []
}>()

function handleUploadConfig() {
  emit('upload')
}

function handleUploadServer() {
  emit('upload-server')
}

function handleStartServer() {
  emit('start')
}

function handleStopServer() {
  emit('stop')
}

function handleDownloadResults() {
  emit('download')
}

function handlePullConfig() {
  emit('pull')
}
</script>

<style scoped>
.win11-form-section {
  @apply space-y-4;
}
</style>