<template>
  <div class="deploy-form">
    <Win11Card>
      <template #title>
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-md bg-win11-accent/10 flex items-center justify-center">
            <svg class="w-5 h-5 text-win11-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
            </svg>
          </div>
          <div>
            <h3 class="text-base font-semibold text-win11-text m-0">{{ t('deploy.sshConfig') }}</h3>
            <p class="text-xs text-win11-text-secondary m-0">Server Deployment</p>
          </div>
        </div>
      </template>

      <div class="space-y-6">
        <DeploySshPanel
          :is-connected="isConnected"
          :connecting="connecting"
          :connection-status="connectionStatus"
          :validation-errors="validationErrors"
          :server-list="serverList"
          :selected-server-name="selectedServerName"
          :loading="loading"
          :ssh-config="sshConfig"
          @update:selected-server-name="handleServerSelect"
          @connect="handleConnect"
          @disconnect="handleDisconnect"
          @create-server="showCreateDialog"
          @edit-server="showEditDialog"
          @delete="handleDeleteServer"
        />

        <Win11Divider />

        <DeployOpsPanel
          :is-connected="isConnected"
          :uploading-config="uploadingConfig"
          :config-upload-status="configUploadStatus"
          :starting-server="startingServer"
          :stopping-server="stoppingServer"
          :downloading-results="downloadingResults"
          :server-running="serverRunning"
          :uploading-server="uploadingServer"
          :syncing-config="syncingConfig"
          @upload="handleUploadConfig"
          @upload-server="handleUploadServer"
          @start="handleStartServer"
          @stop="handleStopServer"
          @download="handleDownloadResults"
          @pull="handlePullConfig"
        />

        <Win11Divider />

        <DeployLogPanel :logs="serverLogs" @clear="clearLogs" />
      </div>
    </Win11Card>

    <DeployServerFormDialog
      v-model="serverFormVisible"
      :mode="serverFormMode"
      :initial-data="serverFormInitialData"
      :test-connection="testConnection"
      :on-save="handleServerFormSave"
    />

    <DeployUploadConfirmDialog
      v-model="uploadConfirmVisible"
      :configs="props.configs"
      :loading="uploadingConfig"
      @confirm="handleUploadConfirm"
      @cancel="uploadConfirmVisible = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { t } from '../i18n'
import { Win11Card, Win11Divider } from '../components/win11'
import { useDeployConnection } from '../composables/useDeployConnection'
import { useDeployServerProfiles } from '../composables/useDeployServerProfiles'
import { useDeployOperations } from '../composables/useDeployOperations'
import DeploySshPanel from '../components/deploy/DeploySshPanel.vue'
import DeployOpsPanel from '../components/deploy/DeployOpsPanel.vue'
import DeployLogPanel from '../components/deploy/DeployLogPanel.vue'
import DeployServerFormDialog from '../components/deploy/DeployServerFormDialog.vue'
import DeployUploadConfirmDialog from '../components/deploy/DeployUploadConfirmDialog.vue'
import type { AllConfigs } from '../types/configuration'
import { normalizeSettings } from '../types/defaults'
import type { SshConfig } from '../types/server'
import type { ServerFormData } from '../components/deploy/DeployServerFormDialog.vue'

interface SshFormConfig extends SshConfig {
  serverPath: string
}

const props = defineProps<{
  configs: AllConfigs
}>()

const emit = defineEmits<{
  'update:configs': [configs: AllConfigs]
}>()

const {
  isConnected,
  connecting,
  connectionStatus,
  validationErrors,
  connect,
  disconnect,
  testConnection,
  refreshStatus,
} = useDeployConnection((msg, type) => addLog(msg, type))

const {
  serverList,
  selectedServerName,
  loading,
  loadServerList,
  selectServer,
  saveCurrentServer,
  updateServer,
  deleteCurrentServer,
} = useDeployServerProfiles()

const {
  uploadingConfig,
  configUploadStatus,
  startingServer,
  stoppingServer,
  downloadingResults,
  serverRunning,
  uploadingServer,
  syncingConfig,
  serverLogs,
  clearLogs,
  addLog,
  deploy,
  startServer,
  stopServer,
  checkServerStatus,
  downloadResults,
  uploadServer,
  pullServerConfig,
} = useDeployOperations()

const sshConfig = reactive<SshFormConfig>({
  host: '',
  port: 22,
  username: '',
  password: '',
  serverPath: 'C:\\ACC_Server',
  authType: 'password',
})

const serverFormVisible = ref(false)
const serverFormMode = ref<'create' | 'edit'>('create')
const serverFormInitialData = ref<ServerFormData | undefined>(undefined)
const uploadConfirmVisible = ref(false)

onMounted(async () => {
  await loadServerList()
  await refreshStatus()
  await hydrateDeployFormFromSession()
})

async function hydrateDeployFormFromSession() {
  const status = connectionStatus.value
  if (!status.connected || !status.host || !status.username) return

  const port = status.port || 22

  // 在已保存服务器列表中查找匹配项（按 host + port + username）
  const matched = serverList.value.find(s =>
    s.host === status.host && s.port === port && s.username === status.username
  )

  if (matched) {
    // 找到已保存档案：从磁盘加载完整 profile（恢复 password、serverPath 等）
    const profile = await selectServer(matched.name)
    if (profile) {
      sshConfig.host = profile.config.host
      sshConfig.port = profile.config.port
      sshConfig.username = profile.config.username
      sshConfig.password = profile.config.password || ''
      sshConfig.serverPath = profile.serverPath || 'C:\\ACC_Server'
      sshConfig.authType = profile.config.authType || 'password'
    }
  } else {
    // 未找到档案（临时连接）：仅填充基本信息，password 置空
    sshConfig.host = status.host
    sshConfig.port = port
    sshConfig.username = status.username
    sshConfig.password = ''
  }

  // 已连接时恢复服务器运行状态
  await checkServerStatus({
    host: sshConfig.host,
    port: sshConfig.port,
    username: sshConfig.username,
    password: sshConfig.password || '',
  })
}

async function handleServerSelect(name: string) {
  if (!name) {
    selectedServerName.value = ''
    sshConfig.host = ''
    sshConfig.port = 22
    sshConfig.username = ''
    sshConfig.password = ''
    sshConfig.serverPath = 'C:\\ACC_Server'
    return
  }
  const profile = await selectServer(name)
  if (profile) {
    sshConfig.host = profile.config.host
    sshConfig.port = profile.config.port
    sshConfig.username = profile.config.username
    sshConfig.password = profile.config.password || ''
    sshConfig.serverPath = profile.serverPath || 'C:\\ACC_Server'
    sshConfig.authType = profile.config.authType || 'password'
  }
}

async function handleConnect(config: { host: string; port: number; username: string; password: string }) {
  const ok = await connect(config)
  if (!ok) return
  sshConfig.host = config.host
  sshConfig.port = config.port
  sshConfig.username = config.username
  sshConfig.password = config.password
  const running = await checkServerStatus(config)
  addLog(running ? t('deploy.accServerDetected') : t('deploy.accServerNotDetected'), running ? 'info' : 'warning')
}

async function handleDisconnect() {
  await disconnect()
}

function showCreateDialog() {
  serverFormMode.value = 'create'
  serverFormInitialData.value = undefined
  serverFormVisible.value = true
}

function showEditDialog() {
  serverFormMode.value = 'edit'
  serverFormInitialData.value = {
    name: selectedServerName.value,
    host: sshConfig.host,
    port: sshConfig.port,
    username: sshConfig.username,
    password: sshConfig.password || '',
    serverPath: sshConfig.serverPath,
    description: '',
  }
  serverFormVisible.value = true
}

async function handleServerFormSave(data: ServerFormData) {
  const config: SshConfig = {
    host: data.host,
    port: data.port,
    username: data.username,
    password: data.password,
    authType: 'password',
  }
  if (serverFormMode.value === 'create') {
    await saveCurrentServer(data.name, config, data.serverPath, data.description || undefined)
    await loadServerList()
    await selectServer(data.name)
    if (data.name) {
      sshConfig.host = data.host
      sshConfig.port = data.port
      sshConfig.username = data.username
      sshConfig.password = data.password
      sshConfig.serverPath = data.serverPath
    }
  } else {
    await updateServer(data.name, config, data.serverPath, data.description || undefined)
    await selectServer(data.name)
    sshConfig.host = data.host
    sshConfig.port = data.port
    sshConfig.username = data.username
    sshConfig.password = data.password
    sshConfig.serverPath = data.serverPath
  }
}

async function handleDeleteServer() {
  await deleteCurrentServer(selectedServerName.value)
  sshConfig.host = ''
  sshConfig.port = 22
  sshConfig.username = ''
  sshConfig.password = ''
  sshConfig.serverPath = 'C:\\ACC_Server'
}

async function handleUploadConfig() {
  uploadConfirmVisible.value = true
}

async function handleUploadConfirm() {
  uploadConfirmVisible.value = false
  const serverPath = sshConfig.serverPath || 'C:\\ACC_Server'
  await deploy(
    { host: sshConfig.host, port: sshConfig.port, username: sshConfig.username, password: sshConfig.password },
    serverPath,
    props.configs
  )
}

async function handleStartServer() {
  const serverPath = sshConfig.serverPath || 'C:\\ACC_Server'
  await startServer(
    { host: sshConfig.host, port: sshConfig.port, username: sshConfig.username, password: sshConfig.password },
    serverPath
  )
}

async function handleStopServer() {
  const serverPath = sshConfig.serverPath || 'C:\\ACC_Server'
  await stopServer(
    { host: sshConfig.host, port: sshConfig.port, username: sshConfig.username, password: sshConfig.password },
    serverPath
  )
}

async function handleDownloadResults() {
  const serverPath = sshConfig.serverPath || 'C:\\ACC_Server'
  await downloadResults(
    { host: sshConfig.host, port: sshConfig.port, username: sshConfig.username, password: sshConfig.password },
    serverPath
  )
}

async function handleUploadServer() {
  const serverPath = sshConfig.serverPath || 'C:\\ACC_Server'
  await uploadServer(
    { host: sshConfig.host, port: sshConfig.port, username: sshConfig.username, password: sshConfig.password },
    serverPath
  )
}

async function handlePullConfig() {
  const serverPath = sshConfig.serverPath || ''
  if (!serverPath) {
    addLog(t('deploy.pullConfigNoServerPath'), 'warning')
    return
  }
  const pulled = await pullServerConfig(
    { host: sshConfig.host, port: sshConfig.port, username: sshConfig.username, password: sshConfig.password },
    serverPath
  )
  if (pulled) {
    emit('update:configs', {
      ...props.configs,
      ...pulled,
      settings: normalizeSettings({
        ...props.configs.settings,
        ...(pulled.settings ?? {}),
      }),
    })
  }
}
</script>

<style scoped>
.deploy-form {
  @apply p-6;
}
</style>
