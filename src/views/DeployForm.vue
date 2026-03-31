<template>
  <div class="deploy-form">
    <el-card class="connection-config">
      <template #header>
        <div class="card-header">
          <span>{{ t('deploy.sshConfig') }}</span>
          <el-tag v-if="isConnected" type="success" size="small">
            {{ t('deploy.connected') }}: {{ connectionStatus.host }}
          </el-tag>
          <el-tag v-else type="info" size="small">{{ t('deploy.notConnected') }}</el-tag>
        </div>
      </template>

      <el-form :model="sshConfig" label-width="120px">
        <el-form-item :label="t('deploy.selectServer')">
          <el-select
            v-model="selectedServerName"
            :placeholder="t('deploy.selectSavedServer')"
            clearable
            filterable
            style="width: 100%"
            @change="handleServerSelect"
          >
            <el-option
              v-for="server in serverList"
              :key="server.name"
              :label="`${server.name} (${server.host})`"
              :value="server.name"
            />
          </el-select>
        </el-form-item>

        <el-form-item :label="t('deploy.serverAddress')" required>
          <el-input
            v-model="sshConfig.host"
            :placeholder="t('deploy.inputServerAddress')"
            :class="{ 'is-error': validationErrors.host }"
            @input="validateForm"
          />
          <div v-if="validationErrors.host" class="el-form-item__error">
            {{ validationErrors.host }}
          </div>
        </el-form-item>
        <el-form-item :label="t('deploy.port')" required>
          <el-input-number
            v-model="sshConfig.port"
            :min="1"
            :max="65535"
            :class="{ 'is-error': validationErrors.port }"
            @change="validateForm"
          />
          <div v-if="validationErrors.port" class="el-form-item__error">
            {{ validationErrors.port }}
          </div>
        </el-form-item>
        <el-form-item :label="t('deploy.username')" required>
          <el-input
            v-model="sshConfig.username"
            :placeholder="t('deploy.inputUsername')"
            :class="{ 'is-error': validationErrors.username }"
            @input="validateForm"
          />
          <div v-if="validationErrors.username" class="el-form-item__error">
            {{ validationErrors.username }}
          </div>
        </el-form-item>
        <el-form-item :label="t('deploy.password')">
          <el-input
            v-model="sshConfig.password"
            type="password"
            show-password
            :placeholder="t('deploy.passwordOptional')"
            @input="validateForm"
          />
        </el-form-item>
        <el-form-item :label="t('deploy.serverPath')">
          <el-input v-model="sshConfig.serverPath" :placeholder="t('deploy.serverPathPlaceholder')" />
        </el-form-item>

        <el-form-item>
          <div class="connection-actions">
            <el-button
              :icon="isConnected ? Close : Connection"
              :type="isConnected ? 'danger' : 'success'"
              :loading="connecting"
              :disabled="!isConnected && !isFormValid"
              @click="handleConnect"
            >
              {{ isConnected ? t('deploy.disconnect') : t('deploy.connect') }}
            </el-button>
            <el-button
              v-if="isConnected && !selectedServerName"
              type="primary"
              :icon="Plus"
              :disabled="!isFormValid"
              @click="showSaveDialog"
            >
              {{ t('deploy.saveCurrentServer') }}
            </el-button>
            <el-button
              v-if="isConnected && selectedServerName"
              type="success"
              :icon="RefreshRight"
              :disabled="!isFormValid"
              @click="handleUpdateServer"
            >
              {{ t('deploy.updateCurrentServer') }}
            </el-button>
            <el-button type="info" @click="clearCurrentInput">
              {{ t('deploy.clearCurrentInput') }}
            </el-button>
            <el-button
              v-if="selectedServerName"
              type="warning"
              :icon="Edit"
              @click="showRenameDialog"
            >
              {{ t('deploy.rename') }}
            </el-button>
            <el-button
              v-if="selectedServerName"
              type="danger"
              :icon="Delete"
              @click="handleDeleteServer"
            >
              {{ t('common.delete') }}
            </el-button>
          </div>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="deploy-options" style="margin-top: 20px">
      <template #header>
        <span>{{ t('deploy.deployOperations') }}</span>
      </template>

      <div class="deploy-buttons">
        <el-button
          type="primary"
          :icon="Upload"
          :loading="uploadingConfig"
          :disabled="!isConnected || startingServer || stoppingServer || serverRunning"
          @click="handleUploadConfig"
        >
          {{ uploadingConfig ? configUploadStatus : t('deploy.uploadConfig') }}
        </el-button>

        <el-button
          type="success"
          :icon="Upload"
          :loading="uploadingServer"
          :disabled="!isConnected || startingServer || stoppingServer || serverRunning"
          @click="handleUploadServer"
        >
          {{ uploadingServer ? serverUploadStatus : t('deploy.uploadServer') }}
        </el-button>

        <el-button
          type="warning"
          :icon="VideoPlay"
          :loading="startingServer"
          :disabled="!isConnected || serverRunning"
          @click="handleStartServer"
        >
          {{ startingServer ? t('deploy.startingServer') : t('deploy.startServer') }}
        </el-button>

        <el-button
          type="danger"
          :icon="VideoPause"
          :loading="stoppingServer"
          :disabled="!isConnected || !serverRunning"
          @click="handleStopServer"
        >
          {{ stoppingServer ? t('deploy.stoppingServer') : t('deploy.stopServer') }}
        </el-button>

        <el-button
          type="info"
          :icon="Download"
          :loading="downloadingResults"
          :disabled="!isConnected || startingServer || stoppingServer"
          @click="handleDownloadResults"
        >
          {{ downloadingResults ? t('deploy.downloadingResults') : t('deploy.downloadResults') }}
        </el-button>
      </div>

      <div v-if="currentOperation" class="operation-status" :class="operationStatusClass">
        {{ currentOperation }}
      </div>
    </el-card>

    <el-card v-if="deployLogs.length > 0" class="deploy-logs" style="margin-top: 20px">
      <template #header>
        <div class="logs-header">
          <span>{{ t('deploy.operationLogs') }}</span>
          <el-button link type="primary" size="small" @click="deployLogs = []">{{ t('deploy.clear') }}</el-button>
        </div>
      </template>
      <div class="logs">
        <div
          v-for="(log, index) in deployLogs"
          :key="index"
          :class="['log-item', `log-${log.type}`]"
        >
          [{{ log.time }}] {{ log.message }}
        </div>
      </div>
    </el-card>

    <el-dialog v-model="saveDialogVisible" :title="t('deploy.saveServer')" width="500px">
      <el-form :model="saveForm" label-width="80px">
        <el-form-item :label="t('deploy.serverName')" required>
          <el-input
            v-model="saveForm.name"
            :placeholder="t('deploy.inputServerName')"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        <el-form-item :label="t('deploy.description')">
          <el-input
            v-model="saveForm.description"
            type="textarea"
            :rows="2"
            :placeholder="t('deploy.inputDescription')"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="saveDialogVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleSaveServer">{{ t('common.save') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="renameDialogVisible" :title="t('deploy.renameServer')" width="500px">
      <el-form :model="renameForm" label-width="80px">
        <el-form-item :label="t('deploy.newName')" required>
          <el-input
            v-model="renameForm.name"
            :placeholder="t('deploy.inputNewName')"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="renameDialogVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleRenameServer">{{ t('common.confirm') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, reactive } from 'vue'
import { Upload, Connection, Close, Plus, Edit, Delete, VideoPlay, VideoPause, Download, RefreshRight } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { invoke } from '@tauri-apps/api/core'
import { open } from '@tauri-apps/plugin-dialog'
import type { AllConfigs } from '../types/configuration'
import type { ServerListItem } from '../types/server'
import { t } from '../i18n'
import {
  getServers,
  saveServer,
  loadServer,
  deleteServer,
  renameServer,
  createServerProfile
} from '../utils/serverManager'

const props = defineProps<{
  configs: AllConfigs
}>()

const sshConfig = ref({
  host: '',
  port: 22,
  username: '',
  password: '',
  serverPath: 'C:/ACC_Server'
})

const validationErrors = reactive({
  host: '',
  port: '',
  username: ''
})

function validateForm() {
  validationErrors.host = ''
  validationErrors.port = ''
  validationErrors.username = ''

  if (!sshConfig.value.host || sshConfig.value.host.trim() === '') {
    validationErrors.host = t('deploy.pleaseInputServerAddress')
  } else {
    validationErrors.host = ''
  }

  if (!sshConfig.value.port || sshConfig.value.port < 1 || sshConfig.value.port > 65535) {
    validationErrors.port = t('deploy.pleaseInputValidPort')
  } else {
    validationErrors.port = ''
  }

  if (!sshConfig.value.username || sshConfig.value.username.trim() === '') {
    validationErrors.username = t('deploy.pleaseInputUsername')
  } else {
    validationErrors.username = ''
  }
}

const isFormValid = computed(() => {
  return (
    sshConfig.value.host.trim() !== '' &&
    sshConfig.value.port >= 1 &&
    sshConfig.value.port <= 65535 &&
    sshConfig.value.username.trim() !== ''
  )
})

const sessionPassword = ref('')

function getEffectivePassword(): string {
  return (sshConfig.value.password || '').trim() || sessionPassword.value
}

function buildSshInvokeConfig() {
  return {
    host: sshConfig.value.host,
    port: sshConfig.value.port,
    username: sshConfig.value.username,
    auth_type: 'password',
    password: getEffectivePassword(),
    private_key: null
  }
}

const uploadingConfig = ref(false)
const configUploadStatus = ref(t('common.loading'))
const uploadingServer = ref(false)
const serverUploadStatus = ref(t('common.loading'))
const startingServer = ref(false)
const stoppingServer = ref(false)
const serverRunning = ref(false)
const downloadingResults = ref(false)
const currentOperation = ref('')
const operationType = ref<'success' | 'error' | 'info'>('info')

const operationStatusClass = computed(() => `status-${operationType.value}`)

const connecting = ref(false)
const isConnected = ref(false)
const connectionStatus = ref({
  connected: false,
  host: '',
  username: ''
})
const deployLogs = ref<Array<{ type: string; message: string; time: string }>>([])

const serverList = ref<ServerListItem[]>([])
const selectedServerName = ref('')

const saveDialogVisible = ref(false)
const saveForm = ref({
  name: '',
  description: ''
})

const renameDialogVisible = ref(false)
const renameForm = ref({
  name: ''
})

function setOperationStatus(message: string, type: 'success' | 'error' | 'info') {
  currentOperation.value = message
  operationType.value = type
}

function clearOperationStatus() {
  currentOperation.value = ''
}

function addLog(type: 'info' | 'success' | 'error', message: string) {
  const now = new Date()
  const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
  deployLogs.value.push({ type, message, time })
}

async function fetchConnectionStatus() {
  try {
    const result = await invoke<{ connected: boolean; host: string; username: string }>('get_connection_status')
    isConnected.value = result.connected
    connectionStatus.value = result
  } catch (error) {
    console.error('获取连接状态失败:', error)
  }
}

async function loadServerList() {
  try {
    serverList.value = await getServers()
  } catch (error) {
    console.error('加载服务器列表失败:', error)
  }
}

function showSaveDialog() {
  if (selectedServerName.value) {
    const server = serverList.value.find(s => s.name === selectedServerName.value)
    saveForm.value.name = selectedServerName.value
    saveForm.value.description = server?.description || ''
  } else {
    saveForm.value.name = ''
    saveForm.value.description = ''
  }
  saveDialogVisible.value = true
}

async function handleSaveServer() {
  const name = saveForm.value.name.trim()

  if (!name) {
    ElMessage.warning(t('deploy.pleaseInputServerName'))
    return
  }

  if (name.length > 50) {
    ElMessage.warning(t('deploy.serverNameTooLong'))
    return
  }

  const exists = serverList.value.some(s => s.name === name)
  if (exists) {
    try {
      await ElMessageBox.confirm(
        t('deploy.confirmOverwriteServer').replace('{name}', name),
        t('deploy.confirmOverwrite'),
        {
          confirmButtonText: t('common.confirm'),
          cancelButtonText: t('common.cancel'),
          type: 'warning'
        }
      )
    } catch {
      return
    }
  }

  try {
    const profile = createServerProfile(
      name,
      {
        host: sshConfig.value.host,
        port: sshConfig.value.port,
        username: sshConfig.value.username,
        password: sshConfig.value.password
      },
      sshConfig.value.serverPath,
      saveForm.value.description.trim() || undefined
    )

    await saveServer(profile)
    ElMessage.success(t('deploy.serverSaved'))
    saveDialogVisible.value = false
    selectedServerName.value = name
    await loadServerList()
  } catch (error) {
    ElMessage.error(t('deploy.saveServerFailed') + ': ' + (error as Error).message)
  }
}

async function handleUpdateServer() {
  if (!selectedServerName.value) return

  const existing = serverList.value.find(s => s.name === selectedServerName.value)

  try {
    const profile = createServerProfile(
      selectedServerName.value,
      {
        host: sshConfig.value.host,
        port: sshConfig.value.port,
        username: sshConfig.value.username,
        password: sshConfig.value.password
      },
      sshConfig.value.serverPath,
      existing?.description
    )

    await saveServer(profile)
    ElMessage.success(t('deploy.serverUpdated'))
    await loadServerList()
  } catch (error) {
    ElMessage.error(t('deploy.updateServerFailed') + ': ' + (error as Error).message)
  }
}

function clearCurrentInput() {
  selectedServerName.value = ''
  sshConfig.value.host = ''
  sshConfig.value.port = 22
  sshConfig.value.username = ''
  sshConfig.value.password = ''
  sshConfig.value.serverPath = 'C:/ACC_Server'
  sessionPassword.value = ''
  validateForm()
}

async function handleServerSelect(name: string) {
  if (!name) {
    return
  }

  try {
    const server = await loadServer(name)
    sshConfig.value.host = server.config.host
    sshConfig.value.port = server.config.port
    sshConfig.value.username = server.config.username
    sshConfig.value.password = server.config.password || ''
    sshConfig.value.serverPath = server.serverPath || 'C:/ACC_Server'
    validateForm()
    ElMessage.success(t('deploy.serverLoaded') + ': ' + name)
  } catch (error) {
    ElMessage.error(t('deploy.loadServerFailed') + ': ' + (error as Error).message)
  }
}

function showRenameDialog() {
  if (!selectedServerName.value) return
  renameForm.value.name = selectedServerName.value
  renameDialogVisible.value = true
}

async function handleRenameServer() {
  const newName = renameForm.value.name.trim()

  if (!newName) {
    ElMessage.warning(t('deploy.pleaseInputNewName'))
    return
  }

  if (newName.length > 50) {
    ElMessage.warning(t('deploy.serverNameTooLong'))
    return
  }

  try {
    await renameServer(selectedServerName.value, newName)
    ElMessage.success(t('deploy.serverRenamed'))
    renameDialogVisible.value = false
    selectedServerName.value = newName
    await loadServerList()
  } catch (error) {
    ElMessage.error(t('deploy.renameServerFailed') + ': ' + (error as Error).message)
  }
}

async function handleDeleteServer() {
  if (!selectedServerName.value) return

  try {
    await ElMessageBox.confirm(
      t('deploy.confirmDeleteServer').replace('{name}', selectedServerName.value),
      t('deploy.confirmDelete'),
      {
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel'),
        type: 'warning'
      }
    )

    await deleteServer(selectedServerName.value)
    ElMessage.success(t('deploy.serverDeleted'))
    selectedServerName.value = ''
    sshConfig.value.host = ''
    sshConfig.value.port = 22
    sshConfig.value.username = ''
    sshConfig.value.password = ''
    sshConfig.value.serverPath = 'C:/ACC_Server'
    sessionPassword.value = ''
    validateForm()
    await loadServerList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(t('deploy.deleteServerFailed') + ': ' + (error as Error).message)
    }
  }
}

async function checkServerRunning() {
  try {
    const sshConfigData = buildSshInvokeConfig()
    const result = await invoke<{ success: boolean; running: boolean; error?: string }>(
      'check_acc_server_status_cmd',
      { sshConfig: sshConfigData }
    )
    serverRunning.value = result.running
    if (result.running) {
      addLog('info', t('deploy.accServerDetected'))
    } else {
      addLog('info', t('deploy.accServerNotDetected'))
    }
  } catch (error) {
    addLog('error', t('deploy.checkServerStatusFailed') + ': ' + (error as Error).message)
  }
}

async function handleConnect() {
  if (isConnected.value) {
    try {
      connecting.value = true
      addLog('info', t('deploy.disconnecting'))
      await invoke('disconnect')
      isConnected.value = false
      serverRunning.value = false
      connectionStatus.value = { connected: false, host: '', username: '' }
      sessionPassword.value = ''
      ElMessage.success(t('deploy.disconnected'))
    } catch (error) {
      addLog('error', t('deploy.disconnectFailed') + ': ' + (error as Error).message)
      ElMessage.error(t('deploy.disconnectFailed'))
    } finally {
      connecting.value = false
    }
  } else {
    if (!getEffectivePassword()) {
      try {
        const { value } = await ElMessageBox.prompt(
          t('deploy.enterPasswordPrompt'),
          t('deploy.enterPassword'),
          {
            confirmButtonText: t('common.confirm'),
            cancelButtonText: t('common.cancel'),
            inputType: 'password',
            inputPattern: /.+/,
            inputErrorMessage: t('deploy.pleaseInputPassword')
          }
        )
        sessionPassword.value = value
      } catch {
        return
      }
    }

    try {
      connecting.value = true
      addLog('info', t('deploy.connecting'))

      const config = buildSshInvokeConfig()

      const result = await invoke<{ success: boolean; error?: string }>('connect', { config })

      if (result.success) {
        isConnected.value = true
        connectionStatus.value = {
          connected: true,
          host: sshConfig.value.host,
          username: sshConfig.value.username
        }
        addLog('success', t('deploy.sshConnected') + `: ${sshConfig.value.host}`)
        ElMessage.success(t('deploy.connected'))
        await checkServerRunning()
      } else {
        addLog('error', t('deploy.connectFailed') + ': ' + result.error)
        ElMessage.error(t('deploy.connectFailed') + ': ' + result.error)
      }
    } catch (error) {
      addLog('error', t('deploy.connectionError') + ': ' + (error as Error).message)
      ElMessage.error(t('deploy.connectFailed'))
    } finally {
      connecting.value = false
    }
  }
}

onMounted(() => {
  fetchConnectionStatus()
  loadServerList()
})

async function handleUploadConfig() {
  try {
    uploadingConfig.value = true
    configUploadStatus.value = t('deploy.deletingOldConfig')
    clearOperationStatus()
    setOperationStatus(t('deploy.deletingOldConfigFiles'), 'info')
    addLog('info', t('deploy.startUploadConfig'))

    const sshConfigData = buildSshInvokeConfig()

    const deleteResult = await invoke<{ success: boolean; error?: string }>('delete_config_folder', {
      config: sshConfigData,
      serverPath: sshConfig.value.serverPath
    })

    if (!deleteResult.success) {
      addLog('error', t('deploy.configDeleted') + ': ' + deleteResult.error)
      setOperationStatus(t('deploy.configDeleted') + ': ' + deleteResult.error, 'error')
      ElMessage.error(t('deploy.configDeleted') + ': ' + deleteResult.error)
      return
    }

    configUploadStatus.value = t('deploy.uploadingConfig')
    setOperationStatus(t('deploy.uploadingConfig'), 'info')
    addLog('info', t('deploy.oldConfigDeleted'))

    const deployResult = await invoke<{ success: boolean; error?: string }>('deploy', {
      sshConfig: sshConfigData,
      options: {
        server_path: sshConfig.value.serverPath,
        download_server: false,
        server_download_url: null,
        start_server: false,
        download_results: false
      },
      configs: props.configs
    })

    if (deployResult.success) {
      addLog('success', t('deploy.configUploadSuccess'))
      setOperationStatus(t('deploy.configUploadSuccess'), 'success')
      ElMessage.success(t('deploy.configUploadSuccess').replace('!', ''))
    } else {
      addLog('error', t('deploy.configUploadFailedMsg') + ': ' + deployResult.error)
      setOperationStatus(t('deploy.configUploadFailedMsg') + ': ' + deployResult.error, 'error')
      ElMessage.error(t('deploy.configUploadFailedMsg') + ': ' + deployResult.error)
    }
  } catch (error) {
    addLog('error', t('deploy.configUploadError') + ': ' + (error as Error).message)
    setOperationStatus(t('deploy.configUploadError') + ': ' + (error as Error).message, 'error')
    ElMessage.error(t('deploy.configUploadFailedMsg'))
  } finally {
    uploadingConfig.value = false
    configUploadStatus.value = t('common.loading')
  }
}

async function handleUploadServer() {
  try {
    uploadingServer.value = true
    serverUploadStatus.value = t('common.loading')
    clearOperationStatus()
    setOperationStatus(t('deploy.uploadingServer'), 'info')
    addLog('info', t('deploy.startUploadServer'))

    const sshConfigData = buildSshInvokeConfig()
    let exeDir = ''
    try {
      exeDir = await invoke<string>('get_app_exe_dir')
    } catch {
      exeDir = ''
    }

    const defaultZipPath = exeDir ? `${exeDir.replace(/\\/g, '/')}/acc-server.zip` : 'acc-server.zip'

    const uploadWithPath = async (localZipPath: string) =>
      invoke<{ success: boolean; error?: string; message?: string }>('upload_acc_server_local_cmd', {
        sshConfig: sshConfigData,
        serverPath: sshConfig.value.serverPath,
        localZipPath
      })

    let result = await uploadWithPath(defaultZipPath)
    if (!result.success && result.error?.includes('读取本地文件失败')) {
      const selected = await open({
        title: t('deploy.selectServerZip'),
        multiple: false,
        filters: [{ name: 'ZIP', extensions: ['zip'] }]
      })

      if (!selected || Array.isArray(selected)) {
        ElMessage.warning(t('deploy.pleaseSelectServerZip'))
        return
      }

      result = await uploadWithPath(selected)
    }

    if (result.success) {
      addLog('success', t('deploy.serverUploadSuccess') + ' ' + (result.message || ''))
      setOperationStatus(t('deploy.serverUploadSuccess'), 'success')
      ElMessage.success(t('deploy.serverUploadSuccess').replace('!', ''))
    } else {
      addLog('error', t('deploy.serverUploadFailedMsg') + ': ' + result.error)
      setOperationStatus(t('deploy.serverUploadFailedMsg') + ': ' + result.error, 'error')
      ElMessage.error(t('deploy.serverUploadFailedMsg') + ': ' + result.error)
    }
  } catch (error) {
    addLog('error', t('deploy.serverUploadError') + ': ' + (error as Error).message)
    setOperationStatus(t('deploy.serverUploadError') + ': ' + (error as Error).message, 'error')
    ElMessage.error(t('deploy.serverUploadFailedMsg'))
  } finally {
    uploadingServer.value = false
    serverUploadStatus.value = t('common.loading')
  }
}

async function handleStartServer() {
  try {
    startingServer.value = true
    clearOperationStatus()
    setOperationStatus(t('deploy.startingServer'), 'info')
    addLog('info', t('deploy.startingServer'))

    const sshConfigData = buildSshInvokeConfig()

    const result = await invoke<{ success: boolean; error?: string }>('start_acc_server_cmd', {
      sshConfig: sshConfigData,
      serverPath: sshConfig.value.serverPath
    })

    if (result.success) {
      serverRunning.value = true
      addLog('success', t('deploy.serverStartSuccess'))
      setOperationStatus(t('deploy.serverStartSuccess'), 'success')
      ElMessage.success(t('deploy.serverStartSuccess').replace('!', ''))
    } else {
      addLog('error', t('deploy.serverStartFailedMsg') + ': ' + result.error)
      setOperationStatus(t('deploy.serverStartFailedMsg') + ': ' + result.error, 'error')
      ElMessage.error(t('deploy.serverStartFailedMsg') + ': ' + result.error)
    }
  } catch (error) {
    addLog('error', t('deploy.serverStartError') + ': ' + (error as Error).message)
    setOperationStatus(t('deploy.serverStartError') + ': ' + (error as Error).message, 'error')
    ElMessage.error(t('deploy.serverStartFailedMsg'))
  } finally {
    startingServer.value = false
  }
}

async function handleStopServer() {
  try {
    stoppingServer.value = true
    clearOperationStatus()
    setOperationStatus(t('deploy.stoppingServer'), 'info')
    addLog('info', t('deploy.stoppingServer'))

    const sshConfigData = buildSshInvokeConfig()

    const result = await invoke<{ success: boolean; error?: string; message?: string }>('stop_acc_server_cmd', {
      sshConfig: sshConfigData
    })

    if (result.success) {
      serverRunning.value = false
      addLog('success', t('deploy.serverStopSuccess'))
      setOperationStatus(t('deploy.serverStopSuccess'), 'success')
      ElMessage.success(t('deploy.serverStopped'))
    } else {
      addLog('error', t('deploy.serverStopFailedMsg') + ': ' + result.error)
      setOperationStatus(t('deploy.serverStopFailedMsg') + ': ' + result.error, 'error')
      ElMessage.error(t('deploy.serverStopFailedMsg') + ': ' + result.error)
    }
  } catch (error) {
    addLog('error', t('deploy.serverStopError') + ': ' + (error as Error).message)
    setOperationStatus(t('deploy.serverStopError') + ': ' + (error as Error).message, 'error')
    ElMessage.error(t('deploy.serverStopFailedMsg'))
  } finally {
    stoppingServer.value = false
  }
}

async function handleDownloadResults() {
  try {
    downloadingResults.value = true
    clearOperationStatus()
    setOperationStatus(t('deploy.downloadingResults'), 'info')
    addLog('info', t('deploy.downloadingResults'))

    const sshConfigData = buildSshInvokeConfig()

    // 获取软件根目录，将结果下载到根目录下的 results 文件夹
    let exeDir: string
    try {
      exeDir = await invoke<string>('get_app_exe_dir')
    } catch {
      exeDir = 'C:/ACC_Results_fallback'
    }
    const localResultsPath = exeDir.replace(/\\/g, '/') + '/results'

    addLog('info', `下载目标路径: ${localResultsPath}`)

    const result = await invoke<{ success: boolean; error?: string; files?: string[] }>('download_results_filtered_cmd', {
      sshConfig: sshConfigData,
      serverPath: sshConfig.value.serverPath,
      localPath: localResultsPath
    })

    if (result.success) {
      const files = result.files || []
      addLog('success', t('deploy.downloadSuccess').replace('{count}', files.length.toString()))
      setOperationStatus(t('deploy.downloadSuccess').replace('{count}', files.length.toString()) + ` -> ${localResultsPath}`, 'success')
      ElMessage.success(t('deploy.downloadSuccess').replace('{count}', files.length.toString()))
    } else {
      addLog('error', t('deploy.downloadFailed') + ': ' + result.error)
      setOperationStatus(t('deploy.downloadFailed') + ': ' + result.error, 'error')
      ElMessage.error(t('deploy.downloadFailed') + ': ' + result.error)
    }
  } catch (error) {
    addLog('error', t('deploy.downloadResultsError') + ': ' + (error as Error).message)
    setOperationStatus(t('deploy.downloadResultsError') + ': ' + (error as Error).message, 'error')
    ElMessage.error(t('deploy.downloadResultsError'))
  } finally {
    downloadingResults.value = false
  }
}
</script>

<style scoped>
.deploy-form {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.connection-actions {
  display: flex;
  gap: 12px;
}

.server-select-footer {
  padding: 8px 0;
  text-align: center;
}

.deploy-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.deploy-buttons .el-button {
  min-width: 160px;
}

.operation-status {
  padding: 12px 16px;
  border-radius: 4px;
  font-size: 14px;
  margin-top: 12px;
}

.status-success {
  background-color: #f0f9eb;
  color: #67c23a;
  border: 1px solid #e1f3d8;
}

.status-error {
  background-color: #fef0f0;
  color: #f56c6c;
  border: 1px solid #fde2e2;
}

.status-info {
  background-color: #f4f4f5;
  color: #909399;
  border: 1px solid #e9e9eb;
}

.logs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logs {
  max-height: 300px;
  overflow-y: auto;
  background-color: #f5f7fa;
  padding: 12px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
}

.log-item {
  margin-bottom: 4px;
  word-break: break-all;
}

.log-info {
  color: #606266;
}

.log-success {
  color: #67c23a;
}

.log-error {
  color: #f56c6c;
}

:deep(.el-form-item.is-error .el-input__wrapper),
:deep(.el-form-item.is-error .el-input-number) {
  box-shadow: 0 0 0 1px #f56c6c inset;
}

:deep(.el-form-item__error) {
  color: #f56c6c;
  font-size: 12px;
  line-height: 1;
  padding-top: 4px;
  position: absolute;
  top: 100%;
  left: 0;
}
</style>