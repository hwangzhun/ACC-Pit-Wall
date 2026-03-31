<template>
  <div class="entry-list-form">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-input
          v-model="searchKeyword"
          :placeholder="t('placeholder.searchEntry')"
          clearable
          class="search-input"
          :prefix-icon="Search"
        />
        <el-select v-model="sortBy" :placeholder="t('common.sortBy')" class="sort-select" filterable>
          <el-option :label="t('sortOptions.teamName')" value="teamName" />
          <el-option :label="t('sortOptions.raceNumber')" value="raceNumber" />
          <el-option :label="t('sortOptions.driverCount')" value="driverCount" />
        </el-select>
        <el-button :icon="sortOrder === 'asc' ? SortUp : SortDown" @click="toggleSortOrder">
        </el-button>
      </div>
      <div class="toolbar-right">
        <el-button v-if="selectedEntries.length > 0" type="danger" :icon="Delete" @click="handleBatchDelete">
          {{ t('common.deleteSelected') }} ({{ selectedEntries.length }})
        </el-button>
        <el-dropdown trigger="click" @command="handleToolbarCommand">
          <el-button :icon="FolderOpened">{{ t('common.importExport') }}</el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="importCsv" :icon="Upload">{{ t('common.importCsv') }}</el-dropdown-item>
              <el-dropdown-item command="exportCsv" :icon="Download" divided>{{ t('common.exportCsv') }}</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-button type="primary" :icon="Plus" @click="dialogVisible = true">
          {{ t('common.addTeam') }}
        </el-button>
      </div>
    </div>

    <!-- 参赛名单全局：仅名单内车手可进服 -->
    <div class="entrylist-global-bar">
      <el-tooltip :content="t('description.forceEntryList')" placement="bottom-start">
        <label class="force-entry-row">
          <span class="force-entry-label">{{ t('form.forceEntryList') }}</span>
          <el-switch
            v-model="forceEntryListModel"
            :active-value="1"
            :inactive-value="0"
            inline-prompt
            :active-text="t('common.on')"
            :inactive-text="t('common.off')"
          />
        </label>
      </el-tooltip>
    </div>

    <!-- 统计信息 -->
    <div class="stats-bar" v-if="filteredEntries.length > 0">
      <el-tag>{{ t('common.totalTeams') }}: {{ filteredEntries.length }}</el-tag>
      <el-tag type="success">{{ t('common.totalDrivers') }}: {{ totalDrivers }}</el-tag>
      <el-tag type="info" v-if="searchKeyword">{{ t('common.searchFilter') }}: "{{ searchKeyword }}"</el-tag>
    </div>

    <!-- 车队卡片网格 -->
    <div v-if="filteredEntries.length > 0" class="entries-grid">
      <el-card
        v-for="(entry, index) in filteredEntries"
        :key="index"
        class="entry-card"
        :class="{ 'is-selected': isSelected(entry) }"
        shadow="hover"
      >
        <template #header>
          <div class="card-header">
            <div class="header-left">
              <el-checkbox
                :model-value="isSelected(entry)"
                @change="(val: boolean) => toggleSelection(entry, val)"
              />
              <span class="race-number">#{{ entry.raceNumber }}</span>
              <div class="team-info">
                <el-input
                  v-if="editingTeamName === entry"
                  v-model="entry.teamName"
                  size="small"
                  @blur="editingTeamName = null"
                  @keyup.enter="editingTeamName = null"
                  ref="teamNameInput"
                />
                <div v-else class="team-name-row">
                  <span
                    class="team-name"
                    @click="startEditingTeamName(entry)"
                    :title="t('common.clickToEdit')"
                  >
                    {{ entry.teamName || t('common.unnamedTeam') }}
                    <el-icon class="edit-icon"><Edit /></el-icon>
                  </span>
                  <span v-if="entry.forcedCarModel > -1" class="car-model-badge">{{ getCarLocalizedName(entry.forcedCarModel) }}</span>
                </div>
              </div>
            </div>
            <div class="header-right">
              <el-tag v-if="entry.isServerAdmin" type="danger" size="small" effect="dark">{{ t('common.admin') }}</el-tag>
              <el-dropdown trigger="click" @command="(cmd: string) => handleCommand(cmd, entry, index)">
                <el-button type="primary" size="small" circle>
                  <el-icon><More /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="edit">{{ t('common.editTeam') }}</el-dropdown-item>
                    <el-dropdown-item command="addDriver">{{ t('common.addDriver') }}</el-dropdown-item>
                    <el-dropdown-item command="duplicate">{{ t('common.duplicate') }}</el-dropdown-item>
                    <el-dropdown-item divided command="delete" type="danger">{{ t('common.deleteTeam') }}</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
        </template>

        <!-- 车队附加信息 -->
        <div class="entry-meta-row">
          <label class="meta-switch">
            <span class="meta-label">{{ t('form.overrideDriverInfo') }}</span>
            <el-switch v-model="entry.overrideDriverInfo" :active-value="1" :inactive-value="0" size="small" @click.stop />
          </label>
          <span v-if="entry.ballastKg > 0" class="meta-item">{{ t('form.ballastKg') }} {{ entry.ballastKg }}kg</span>
          <span v-if="entry.restrictor < 100" class="meta-item">{{ t('form.restrictor') }} {{ entry.restrictor }}%</span>
        </div>

        <!-- 车手列表 -->
        <div class="drivers-section">
          <div class="drivers-list">
            <div
              v-for="(driver, driverIndex) in entry.drivers"
              :key="driverIndex"
              :class="[
                'driver-item',
                `driver-cat-${driver.driverCategory}`,
                { 'driver-steamid-invalid': isDriverSteamIdInvalid(driver.playerID) },
              ]"
              :title="
                isDriverSteamIdInvalid(driver.playerID)
                  ? steamIdListItemTitle(driver.playerID)
                  : undefined
              "
              @click="editDriver(entry, driver, driverIndex)"
            >
              <div class="driver-info">
                <div class="driver-name-row">
                  <span :class="['category-pill', `cat-${driver.driverCategory}`]">{{ getCategoryName(driver.driverCategory) }}</span>
                  <span class="driver-name">{{ driver.firstName }} {{ driver.lastName }}</span>
                  <span v-if="driver.shortName" class="short-name">{{ driver.shortName }}</span>
                  <NationalityLabel class="driver-nationality" :nationality-id="driver.nationality" />
                </div>
                <div
                  v-if="driver.playerID"
                  class="driver-id"
                  :class="{ 'driver-id--invalid': isDriverSteamIdInvalid(driver.playerID) }"
                >
                  {{ driver.playerID }}
                </div>
              </div>
              <el-button
                type="danger"
                size="small"
                circle
                class="delete-driver-btn"
                @click.stop="removeDriverFromEntry(entry, driverIndex)"
              >
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>
          <el-button
            v-if="entry.drivers.length < 5"
            type="primary"
            size="small"
            text
            class="add-driver-btn"
            @click="addDriverToEntry(entry)"
          >
            <el-icon><Plus /></el-icon> {{ t('common.addDriver') }}
          </el-button>
        </div>
      </el-card>
    </div>

    <!-- 空状态 -->
    <el-empty v-else :description="t('common.noEntryList')" class="empty-state">
      <template #image>
        <el-icon :size="80" color="#909399"><User /></el-icon>
      </template>
      <el-button type="primary" :icon="Plus" @click="dialogVisible = true">{{ t('common.addTeam') }}</el-button>
      <el-button :icon="Upload" @click="showCsvUpload = true">{{ t('common.importCsv') }}</el-button>
    </el-empty>

    <!-- CSV导入对话框 -->
    <el-dialog
      v-model="showCsvUpload"
      :title="t('title.importCsv')"
      width="600px"
    >
      <el-alert
        :title="t('description.csvFormat')"
        type="info"
        :closable="false"
        style="margin-bottom: 20px;"
      />
      <el-upload
        ref="uploadRef"
        drag
        accept=".csv,.txt"
        :auto-upload="false"
        :on-change="handleCsvFileChange"
        :limit="1"
      >
        <el-icon :size="50"><UploadFilled /></el-icon>
        <div class="el-upload__text">
          {{ t('description.dragDrop') }}
        </div>
      </el-upload>
      
      <el-checkbox v-model="mergeWithExisting" style="margin-top: 20px;">
        {{ t('common.mergeWithExisting') }}
      </el-checkbox>

      <template #footer>
        <el-button @click="showCsvUpload = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleCsvUpload" :loading="csvUploading">
          {{ t('common.confirm') }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 添加/编辑车队对话框 -->
    <EntryDialog
      v-model:visible="dialogVisible"
      :edit-entry="editingEntry"
      @confirm="handleDialogConfirm"
    />

    <!-- 编辑车手对话框 -->
    <el-dialog
      v-model="driverDialogVisible"
      :title="t('common.editDriver')"
      width="600px"
    >
      <el-form v-if="editingDriver" :model="editingDriver" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="t('form.firstName')">
              <el-input v-model="editingDriver.firstName" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="t('form.lastName')">
              <el-input v-model="editingDriver.lastName" @blur="onEditDriverLastNameBlur" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item
              :label="t('form.playerId')"
              :class="{ 'form-item-steamid-invalid': isDriverSteamIdInvalid(editingDriver.playerID) }"
            >
              <el-input
                v-model="editingDriver.playerID"
                :placeholder="t('placeholder.steamId')"
                maxlength="20"
                @blur="onEditPlayerIdBlur"
              />
              <div
                v-if="isSteamIdTooShort(editingDriver.playerID)"
                class="steamid-field-hint steamid-field-hint--warning"
              >
                {{ steamIdTooShortLabel(editingDriver.playerID) }}
              </div>
              <div
                v-else-if="isSteamIdTooLong(editingDriver.playerID)"
                class="steamid-field-hint steamid-field-hint--warning"
              >
                {{ steamIdTooLongLabel(editingDriver.playerID) }}
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="t('form.shortName')">
              <el-input
                :model-value="editingDriver.shortName"
                maxlength="3"
                show-word-limit
                @update:model-value="updateEditingShortName"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="t('common.category')">
              <el-select v-model="editingDriver.driverCategory" :placeholder="t('common.pleaseSelect')" filterable style="width: 100%;">
                <el-option
                  v-for="level in driverLevelOptions"
                  :key="level.value"
                  :label="level.label"
                  :value="level.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="t('form.nationality')">
              <el-select v-model="editingDriver.nationality" :placeholder="t('common.pleaseSelect')" filterable style="width: 100%;">
                <el-option
                  v-for="nation in nationalitySelectOptions"
                  :key="nation.value"
                  :label="nation.name"
                  :value="nation.value"
                >
                  <span class="nationality-option">
                    <span
                      v-if="nation.flagIso"
                      class="fi nationality-option__flag"
                      :class="`fi-${nation.flagIso}`"
                    />
                    <span>{{ nation.name }}</span>
                  </span>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="driverDialogVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" @click="saveDriverEdit">{{ t('common.save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import {
  Delete,
  Plus,
  Upload,
  Download,
  FolderOpened,
  UploadFilled,
  Search,
  SortUp,
  SortDown,
  Edit,
  More,
  User
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, type UploadFile } from 'element-plus'
import type { EntryList, Entry, Driver } from '../types/configuration'
import { parseCSV, mergeEntryLists } from '../utils/csvParser'
import {
  defaultShortNameFromLastName,
  normalizeShortNameInput,
} from '../utils/driverShortName'
import {
  getSteamIdDigitCount,
  isDriverSteamIdInvalid,
  isSteamIdTooLong,
  isSteamIdTooShort,
  normalizeSteamId,
  requireValidSteamIdForDriver,
  steamIdsEqual,
} from '../utils/steamId'
import EntryDialog from './EntryDialog.vue'
import NationalityLabel from './NationalityLabel.vue'
import { getCategoryName, driverCategories } from '../data/mappings'
import { t } from '../i18n'
import { getNationalitySelectOptionsI18n, getCarLocalizedName } from '../i18n/mappings'

const props = defineProps<{
  entryList: EntryList
}>()

const forceEntryListModel = computed({
  get: () => (props.entryList.forceEntryList ?? 0) as 0 | 1,
  set: (v: number) => {
    props.entryList.forceEntryList = v ? 1 : 0
  },
})

// ============ 响应式数据 ============
const searchKeyword = ref('')
const sortBy = ref('raceNumber')
const sortOrder = ref<'asc' | 'desc'>('asc')
const selectedEntries = ref<Entry[]>([])
const showCsvUpload = ref(false)
const dialogVisible = ref(false)
const csvUploading = ref(false)
const mergeWithExisting = ref(true)
const selectedCsvFile = ref<File | null>(null)
const uploadRef = ref()
const editingTeamName = ref<Entry | null>(null)
const teamNameInput = ref<HTMLInputElement>()
const editingEntry = ref<Entry | null>(null)

// 车手编辑相关
const driverDialogVisible = ref(false)
const editingDriver = ref<Driver | null>(null)
const editingDriverIndex = ref<number>(-1)
const editingDriverEntry = ref<Entry | null>(null)

const driverLevelOptions = Object.entries(driverCategories)
  .map(([value, label]) => ({
    value: Number(value),
    label: `${value} - ${label}`,
  }))
  .sort((a, b) => a.value - b.value)

const nationalitySelectOptions = computed(() => getNationalitySelectOptionsI18n())

// ============ 计算属性 ============
// 筛选和排序后的列表
const filteredEntries = computed(() => {
  let result = [...props.entryList.entries]
  
  // 搜索筛选
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(entry => {
      // 搜索车队名称
      if (entry.teamName?.toLowerCase().includes(keyword)) return true
      // 搜索赛车号码
      if (entry.raceNumber.toString().includes(keyword)) return true
      // 搜索车手
      return entry.drivers.some(driver =>
        driver.firstName?.toLowerCase().includes(keyword) ||
        driver.lastName?.toLowerCase().includes(keyword) ||
        driver.playerID?.toLowerCase().includes(keyword) ||
        driver.shortName?.toLowerCase().includes(keyword)
      )
    })
  }
  
  // 排序
  result.sort((a, b) => {
    let comparison = 0
    switch (sortBy.value) {
      case 'teamName':
        comparison = (a.teamName || '').localeCompare(b.teamName || '')
        break
      case 'raceNumber':
        comparison = a.raceNumber - b.raceNumber
        break
      case 'driverCount':
        comparison = a.drivers.length - b.drivers.length
        break
    }
    return sortOrder.value === 'asc' ? comparison : -comparison
  })
  
  return result
})

// 车手总数
const totalDrivers = computed(() => {
  return filteredEntries.value.reduce((sum, entry) => sum + entry.drivers.length, 0)
})

// ============ 方法 ============
// 批量选择相关
function isSelected(entry: Entry): boolean {
  return selectedEntries.value.includes(entry)
}

function toggleSelection(entry: Entry, selected: boolean) {
  if (selected) {
    if (!selectedEntries.value.includes(entry)) {
      selectedEntries.value.push(entry)
    }
  } else {
    const index = selectedEntries.value.indexOf(entry)
    if (index > -1) {
      selectedEntries.value.splice(index, 1)
    }
  }
}

function handleBatchDelete() {
  if (selectedEntries.value.length === 0) return
  
  ElMessageBox.confirm(
    t('common.confirmBatchDelete').replace('{count}', selectedEntries.value.length.toString()),
    t('common.batchDelete'),
    {
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      type: 'warning'
    }
  ).then(() => {
    // 从 entryList 中删除选中的车队
    props.entryList.entries = props.entryList.entries.filter(
      entry => !selectedEntries.value.includes(entry)
    )
    selectedEntries.value = []
    ElMessage.success(t('common.batchDeleteSuccess'))
  })
}

// 工具栏命令
function handleToolbarCommand(command: string) {
  switch (command) {
    case 'importCsv':
      showCsvUpload.value = true
      break
    case 'exportCsv':
      handleExportCsv()
      break
  }
}

// 排序相关
function toggleSortOrder() {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
}

// 车队名称编辑
function startEditingTeamName(entry: Entry) {
  editingTeamName.value = entry
  nextTick(() => {
    teamNameInput.value?.focus()
  })
}

// 命令处理（下拉菜单）
function handleCommand(command: string, entry: Entry, index: number) {
  switch (command) {
    case 'edit':
      editingEntry.value = entry
      dialogVisible.value = true
      break
    case 'addDriver':
      addDriverToEntry(entry)
      break
    case 'duplicate':
      duplicateEntry(entry)
      break
    case 'delete':
      deleteEntry(index)
      break
  }
}

// 删除车队
function deleteEntry(index: number) {
  const entry = props.entryList.entries[index]
  ElMessageBox.confirm(
    `${t('common.confirmDeleteTeam')} "${entry.teamName || t('common.unnamedTeam')}"?`,
    t('common.deleteTeam'),
    {
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      type: 'warning'
    }
  ).then(() => {
    props.entryList.entries.splice(index, 1)
    ElMessage.success(t('common.teamDeleted'))
  })
}

// 复制车队
function duplicateEntry(entry: Entry) {
  const newEntry: Entry = {
    ...entry,
    teamName: `${entry.teamName || t('common.unnamed')} (${t('common.duplicate')})`,
    raceNumber: entry.raceNumber + 1,
    drivers: entry.drivers.map(d => ({ ...d }))
  }
  props.entryList.entries.push(newEntry)
  ElMessage.success(t('common.teamDuplicated'))
}

// 添加车手到车队
function addDriverToEntry(entry: Entry) {
  if (entry.drivers.length >= 5) {
    ElMessage.warning(t('common.maxDriversPerTeam'))
    return
  }
  entry.drivers.push({
    driverCategory: 0,
    firstName: '',
    lastName: '',
    playerID: '',
    shortName: '',
    nationality: 0
  })
  // 打开编辑对话框
  const newIndex = entry.drivers.length - 1
  editDriver(entry, entry.drivers[newIndex], newIndex)
}

// 从车队移除车手
function removeDriverFromEntry(entry: Entry, driverIndex: number) {
  ElMessageBox.confirm(t('common.confirmDeleteDriver'), t('common.tip'), {
    confirmButtonText: t('common.confirm'),
    cancelButtonText: t('common.cancel'),
    type: 'warning'
  }).then(() => {
    entry.drivers.splice(driverIndex, 1)
    ElMessage.success(t('common.driverDeleted'))
  })
}

// 编辑车手
function editDriver(entry: Entry, driver: Driver, driverIndex: number) {
  editingDriver.value = { ...driver }
  editingDriverIndex.value = driverIndex
  editingDriverEntry.value = entry
  driverDialogVisible.value = true
}

function onEditDriverLastNameBlur() {
  const d = editingDriver.value
  if (!d) return
  if (!d.shortName?.trim()) {
    d.shortName = defaultShortNameFromLastName(d.lastName)
  }
}

function updateEditingShortName(v: string) {
  const d = editingDriver.value
  if (d) d.shortName = normalizeShortNameInput(v)
}

function steamIdTooShortLabel(pid: string | undefined) {
  return t('message.steamIdTooShort').replace(
    '{count}',
    String(getSteamIdDigitCount(pid))
  )
}

function steamIdTooLongLabel(pid: string | undefined) {
  return t('message.steamIdTooLong').replace(
    '{count}',
    String(getSteamIdDigitCount(pid))
  )
}

function steamIdSaveErrorMessage(pid: string): string {
  if (isSteamIdTooShort(pid)) return steamIdTooShortLabel(pid)
  if (isSteamIdTooLong(pid)) return steamIdTooLongLabel(pid)
  return t('message.invalidSteamId')
}

/** 列表上车手卡片悬停提示（与保存校验文案一致） */
function steamIdListItemTitle(pid: string | undefined): string {
  return steamIdSaveErrorMessage(normalizeSteamId(pid || ''))
}

function onEditPlayerIdBlur() {
  const d = editingDriver.value
  if (!d) return
  d.playerID = normalizeSteamId(d.playerID || '')
  const pid = d.playerID
  if (isSteamIdTooShort(pid)) {
    ElMessage.warning(steamIdTooShortLabel(pid))
  } else if (isSteamIdTooLong(pid)) {
    ElMessage.warning(steamIdTooLongLabel(pid))
  }
}

// 保存车手编辑
function saveDriverEdit() {
  if (!editingDriver.value || editingDriverEntry.value === null || editingDriverIndex.value === -1) return

  const d = editingDriver.value
  if (!d.shortName?.trim()) {
    d.shortName = defaultShortNameFromLastName(d.lastName)
  }
  d.shortName = normalizeShortNameInput(d.shortName || '')
  const req = requireValidSteamIdForDriver(d.playerID)
  if (!req.ok) {
    if (req.reason === 'empty') {
      ElMessage.error(t('message.steamIdRequired'))
    } else {
      d.playerID = req.normalized
      ElMessage.error(steamIdSaveErrorMessage(d.playerID))
    }
    return
  }
  d.playerID = req.normalized

  editingDriverEntry.value.drivers[editingDriverIndex.value] = { ...d }
  driverDialogVisible.value = false
  editingDriver.value = null
  editingDriverIndex.value = -1
  editingDriverEntry.value = null
  ElMessage.success(t('common.updateSuccess'))
}

// CSV导入相关
function handleCsvFileChange(file: UploadFile) {
  if (file.raw) {
    selectedCsvFile.value = file.raw
  }
}

async function handleCsvUpload() {
  if (!selectedCsvFile.value) {
    ElMessage.warning(t('message.noFileSelected'))
    return
  }

  csvUploading.value = true

  try {
    const content = await selectedCsvFile.value.text()
    const result = parseCSV(content)

    if (result.errors.length > 0) {
      ElMessage.error(`${t('message.parseFailed')}: ${result.errors.join(', ')}`)
      return
    }

    if (result.warnings.length > 0) {
      ElMessage.warning(result.warnings.join('\n'))
    }

    if (mergeWithExisting.value) {
      const merged = mergeEntryLists(props.entryList, result.entryList)
      props.entryList.entries = merged.entries
      props.entryList.forceEntryList = merged.forceEntryList
    } else {
      const savedForce = props.entryList.forceEntryList ?? 0
      props.entryList.entries = result.entryList.entries
      props.entryList.forceEntryList = savedForce
    }

    showCsvUpload.value = false
    selectedCsvFile.value = null
    if (uploadRef.value) {
      uploadRef.value.clearFiles()
    }

    ElMessage.success(`${t('common.importSuccess')}: ${result.entryList.entries.length}`)
  } catch (error) {
    ElMessage.error(t('message.fileReadFailed') + ': ' + (error as Error).message)
  } finally {
    csvUploading.value = false
  }
}

function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function buildCsvContent(): string {
  const header = 'playerID,teamName,raceNumber,defaultGridPosition,firstName,lastName,shortName,overrideDriverInfo,isServerAdmin,nationality,driverCategory,forcedCarModel,ballastKg,restrictor'
  const rows: string[] = [header]

  for (const entry of props.entryList.entries) {
    for (const driver of entry.drivers) {
      const row = [
        escapeCsvField(driver.playerID || ''),
        escapeCsvField(entry.teamName || ''),
        String(entry.raceNumber),
        String(entry.defaultGridPosition || 0),
        escapeCsvField(driver.firstName || ''),
        escapeCsvField(driver.lastName || ''),
        escapeCsvField(driver.shortName || ''),
        String(entry.overrideDriverInfo ?? 1),
        String(entry.isServerAdmin || 0),
        String(driver.nationality || 0),
        String(driver.driverCategory || 0),
        String(entry.forcedCarModel ?? -1),
        String(entry.ballastKg || 0),
        String(entry.restrictor || 0)
      ].join(',')
      rows.push(row)
    }
  }

  return '\uFEFF' + rows.join('\n')
}

async function handleExportCsv() {
  if (props.entryList.entries.length === 0) {
    ElMessage.warning(t('message.noDataToExport'))
    return
  }

  const content = buildCsvContent()
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' })

  if ('showSaveFilePicker' in window) {
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: 'entrylist.csv',
        types: [{
          description: 'CSV ' + t('common.file'),
          accept: { 'text/csv': ['.csv'] }
        }]
      })
      const writable = await handle.createWritable()
      await writable.write(blob)
      await writable.close()
      ElMessage.success(t('common.exportSuccess'))
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        ElMessage.error(t('message.exportFailed') + ': ' + e.message)
      }
    }
  } else {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'entrylist.csv'
    a.click()
    URL.revokeObjectURL(url)
    ElMessage.success(t('common.exportSuccess'))
  }
}

function handleDialogConfirm(entry: Entry) {
  if (editingEntry.value) {
    // 编辑模式：替换原有车队
    const index = props.entryList.entries.findIndex(e => e === editingEntry.value)
    if (index !== -1) {
      props.entryList.entries[index] = entry
      ElMessage.success(t('common.updateSuccess'))
    }
    editingEntry.value = null
  } else {
    // 添加模式：检查是否已存在
    const existingIndex = props.entryList.entries.findIndex(
      e => e.teamName === entry.teamName
    )

    if (existingIndex >= 0) {
      ElMessageBox.confirm(
        `${t('common.teamExists')}: "${entry.teamName}" - ${t('common.mergeDrivers')}?`,
        t('common.teamExists'),
        {
          confirmButtonText: t('common.merge'),
          cancelButtonText: t('common.replace'),
          distinguishCancelAndClose: true,
          type: 'warning'
        }
      ).then(() => {
        entry.drivers.forEach(driver => {
          const exists = props.entryList.entries[existingIndex].drivers.some(
            d =>
              steamIdsEqual(d.playerID, driver.playerID) ||
              (d.firstName === driver.firstName && d.lastName === driver.lastName)
          )
          if (!exists) {
            props.entryList.entries[existingIndex].drivers.push(driver)
          }
        })
        ElMessage.success(t('common.driversMerged'))
      }).catch((action) => {
        if (action === 'cancel') {
          props.entryList.entries[existingIndex] = entry
          ElMessage.success(t('common.teamReplaced'))
        }
      })
    } else {
      props.entryList.entries.push(entry)
      ElMessage.success(t('common.addSuccess'))
    }
  }
}
</script>

<style scoped>
.entry-list-form {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.search-input {
  width: 220px;
}

.sort-select {
  width: 130px;
}

.entrylist-global-bar {
  margin-bottom: 14px;
  padding: 10px 14px;
  background: var(--el-fill-color-blank);
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
}

.force-entry-row {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: help;
}

.force-entry-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.stats-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.entries-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 16px;
}

.entry-card {
  transition: all 0.3s ease;
}

.entry-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.entry-card.is-selected {
  border-color: #409EFF;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.race-number {
  font-size: 18px;
  font-weight: bold;
  color: #409EFF;
  background: linear-gradient(135deg, #409EFF 0%, #6BB6FF 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  min-width: 45px;
}

.team-info {
  flex: 1;
  min-width: 0;
}

.team-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.team-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.team-name:hover {
  color: var(--el-color-primary);
}

.edit-icon {
  font-size: 12px;
  opacity: 0;
  transition: opacity 0.2s;
  flex-shrink: 0;
}

.team-name:hover .edit-icon {
  opacity: 1;
}

.car-model-badge {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color);
  padding: 1px 8px;
  border-radius: 10px;
  white-space: nowrap;
  flex-shrink: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.entry-meta-row {
  display: flex;
  gap: 12px;
  padding-bottom: 10px;
  margin-bottom: 8px;
  border-bottom: 1px dashed var(--el-border-color-lighter);
}

.meta-switch {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: default;
}

.meta-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.meta-item {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.drivers-section {
  padding-top: 0;
}

.drivers-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.driver-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: var(--el-fill-color-lighter);
  border-radius: 6px;
  border-left: 3px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.driver-item:hover {
  background: var(--el-color-primary-light-9);
}

.driver-item:hover .delete-driver-btn {
  opacity: 1;
}

.driver-cat-0 { border-left-color: #cd7f32; }
.driver-cat-1 { border-left-color: #a8a8a8; }
.driver-cat-2 { border-left-color: #f0c800; }
.driver-cat-3 { border-left-color: #b8d4e3; }
.driver-cat-4 { border-left-color: #e05555; }

.driver-item.driver-steamid-invalid {
  background: color-mix(in srgb, var(--el-color-danger) 14%, var(--el-fill-color-lighter));
  box-shadow: inset 0 0 0 1px var(--el-color-danger);
}

.driver-item.driver-steamid-invalid:hover {
  background: color-mix(in srgb, var(--el-color-danger) 18%, var(--el-color-primary-light-9));
}

.driver-id--invalid {
  color: var(--el-color-danger);
  font-weight: 600;
}

.driver-info {
  flex: 1;
  min-width: 0;
}

.driver-name-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: nowrap;
  min-width: 0;
}

.category-pill {
  font-size: 10px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 3px;
  color: #fff;
  white-space: nowrap;
  flex-shrink: 0;
  line-height: 1.6;
}

.cat-0 { background: #cd7f32; }
.cat-1 { background: #a8a8a8; }
.cat-2 { background: #d4a800; }
.cat-3 { background: #8bafc4; }
.cat-4 { background: #e05555; }

.driver-name {
  font-weight: 600;
  color: var(--el-text-color-primary);
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.short-name {
  color: var(--el-text-color-placeholder);
  font-size: 11px;
  flex-shrink: 0;
}

.driver-nationality {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  margin-left: auto;
  flex-shrink: 0;
  white-space: nowrap;
}

.nationality-option {
  display: inline-flex;
  align-items: center;
  gap: 0.35em;
}

.nationality-option__flag {
  flex-shrink: 0;
  border-radius: 2px;
}

.driver-id {
  font-size: 11px;
  font-family: 'Consolas', 'Monaco', monospace;
  color: var(--el-text-color-placeholder);
  margin-top: 2px;
  padding-left: 1px;
}

.form-item-steamid-invalid :deep(.el-input__wrapper) {
  box-shadow: 0 0 0 1px var(--el-color-danger) inset;
}

.steamid-field-hint {
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.4;
}

.steamid-field-hint--warning {
  color: var(--el-color-warning);
}

.delete-driver-btn {
  opacity: 0;
  transition: opacity 0.2s;
  flex-shrink: 0;
}

.add-driver-btn {
  margin-top: 8px;
  width: 100%;
}

.empty-state {
  padding: 60px 20px;
}

:deep(.el-empty__description) {
  margin-top: 16px;
  color: #909399;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .toolbar-left,
  .toolbar-right {
    justify-content: center;
  }

  .search-input {
    width: 100%;
  }

  .entries-grid {
    grid-template-columns: 1fr;
  }

  .card-header {
    flex-direction: column;
    gap: 8px;
  }

  .header-left {
    width: 100%;
  }
}
</style>
