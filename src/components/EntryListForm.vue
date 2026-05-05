<template>
  <div class="entry-list-form">
    <Win11Card>
      <template #title>
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-md bg-win11-accent/10 flex items-center justify-center">
            <svg class="w-5 h-5 text-win11-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <h3 class="text-base font-semibold text-win11-text m-0">{{ t('nav.entryList') }}</h3>
            <p class="text-xs text-win11-text-secondary m-0">Grid Management</p>
          </div>
        </div>
      </template>

      <div class="space-y-6">
        <!-- 视图切换 + 工具栏 -->
    <div class="win11-toolbar">
      <div class="win11-toolbar-left">
        <Win11Input
          v-model="searchKeyword"
          :placeholder="t('placeholder.searchEntry')"
        />
        <Win11Select
          v-model="sortBy"
          :options="sortOptions"
          :placeholder="t('common.sortBy')"
        />
        <Win11Button variant="secondary" @click="toggleSortOrder">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        </Win11Button>
        <Win11Button
          v-if="hasHealthIssues"
          variant="warning"
          size="small"
          @click="showHealthIssuesOnly = !showHealthIssuesOnly"
          :class="{ 'is-active': showHealthIssuesOnly }"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {{ t('common.healthIssues') }} ({{ healthIssueCount }})
        </Win11Button>
      </div>

      <div class="win11-toolbar-right">
        <!-- 视图切换 -->
        <div class="win11-view-toggle">
          <button
            class="view-toggle-btn"
            :class="{ active: viewMode === 'card' }"
            @click="viewMode = 'card'"
            :title="t('common.viewCard')"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button
            class="view-toggle-btn"
            :class="{ active: viewMode === 'table' }"
            @click="viewMode = 'table'"
            :title="t('common.viewTable')"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
            </svg>
          </button>
        </div>
        <Win11Button
          v-if="selectedEntries.length > 0"
          variant="danger"
          @click="handleBatchDelete"
        >
          {{ t('common.deleteCount').replace('{count}', selectedEntries.length.toString()) }}
        </Win11Button>
        <Win11Button variant="secondary" @click="showImportMenu = !showImportMenu">
          {{ t('common.importExport') }}
        </Win11Button>
        <Win11Button variant="primary" @click="dialogVisible = true">
          {{ t('common.addTeam') }}
        </Win11Button>
      </div>
    </div>

        <div class="win11-toggle-row">
          <div class="win11-toggle-info">
            <span class="win11-toggle-label">{{ t('form.forceEntryList') }}</span>
            <span class="win11-toggle-desc">{{ t('description.forceEntryList') }}</span>
          </div>
          <Win11Toggle
            :model-value="forceEntryListModel === 1"
            @update:model-value="forceEntryListModel = $event ? 1 : 0"
          />
        </div>

        <div v-if="filteredEntries.length > 0" class="flex gap-2 flex-wrap">
          <div class="win11-stat-tag">
            <span class="font-semibold">{{ filteredEntries.length }}</span> {{ t('common.teams') }}
          </div>
          <div class="win11-stat-tag">
            <span class="font-semibold">{{ totalDrivers }}</span> {{ t('common.drivers') }}
          </div>
          <div v-if="searchKeyword" class="win11-stat-tag">
            {{ t('common.searchLabel').replace('{keyword}', searchKeyword) }}
          </div>
        </div>

        <!-- 卡片视图 -->
        <div v-if="filteredEntries.length > 0 && viewMode === 'card'" class="entries-grid">
          <div
            v-for="(entry, index) in filteredEntries"
            :key="`${entry.teamName}-${entry.raceNumber}-${entry.defaultGridPosition}`"
            class="win11-entry-card"
            :class="{ 'is-selected': isSelected(entry) }"
          >
            <div class="entry-card-header">
              <input
                type="checkbox"
                :checked="isSelected(entry)"
                @change="(e) => toggleSelection(entry, (e.target as HTMLInputElement).checked)"
                class="win11-checkbox"
              />
              <span class="race-number">#{{ entry.raceNumber }}</span>
              <div class="team-info">
                <input
                  v-if="editingTeamName === entry"
                  v-model="entry.teamName"
                  class="win11-input team-name-input"
                  @blur="editingTeamName = null"
                  @keyup.enter="editingTeamName = null"
                />
                <span
                  v-else
                  class="team-name"
                  @click="startEditingTeamName(entry)"
                >
                  {{ entry.teamName || t('common.unnamedTeam') }}
                </span>
                <span v-if="entry.forcedCarModel > -1" class="car-model-badge">
                  {{ getCarLocalizedName(entry.forcedCarModel) }}
                </span>
              </div>
              <div class="entry-actions">
                <button class="win11-icon-btn" @click="handleCommand('edit', entry, index)">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button class="win11-icon-btn danger" @click="handleCommand('delete', entry, index)">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            <div class="drivers-list">
              <button
                class="win11-driver-expand-btn"
                @click.stop="toggleDriversExpanded(entry)"
              >
                <span class="driver-count-badge">{{ entry.drivers.length }}</span>
                <span class="driver-count-label">{{ t('common.drivers') }}</span>
                <svg
                  class="expand-icon"
                  :class="{ expanded: isDriversExpanded(entry) }"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
                <span v-if="entryHealthIssues(entry).length > 0" class="health-badge" :title="t('common.healthIssues')">
                  <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </span>
              </button>

              <div v-if="isDriversExpanded(entry)" class="drivers-list-detail">
                <div
                  v-for="(driver, driverIndex) in entry.drivers"
                  :key="driverIndex"
                  class="win11-driver-item"
                  :class="{ 'has-issue': !isDriverHealthy(entry, driverIndex) }"
                  @click="editDriver(entry, driver, driverIndex)"
                >
                  <span :class="['category-pill', `cat-${driver.driverCategory}`]">
                    {{ getCategoryName(driver.driverCategory) }}
                  </span>
                  <span class="driver-name">{{ driver.firstName }} {{ driver.lastName }}</span>
                  <span class="driver-id">{{ driver.playerID }}</span>
                  <button
                    class="win11-icon-btn danger"
                    @click.stop="removeDriverFromEntry(entry, driverIndex)"
                  >
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <button
                  v-if="entry.drivers.length < 5"
                  class="win11-add-driver-btn"
                  @click="addDriverToEntry(entry)"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                  {{ t('common.addDriver') }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 表格视图 -->
        <EntryListTableView
          v-if="filteredEntries.length > 0 && viewMode === 'table'"
          :entries="filteredEntries"
          v-model:selected="selectedEntries"
          @edit="(entry) => handleCommand('edit', entry, 0)"
          @delete="(entry) => handleCommand('delete', entry, 0)"
          @batch-delete="handleBatchDelete"
        />

        <div v-if="filteredEntries.length === 0" class="win11-empty-state">
          <svg class="w-16 h-16 text-win11-text-secondary mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p class="text-win11-text-secondary mb-4">{{ t('common.noEntryList') }}</p>
          <div class="flex gap-2">
            <Win11Button variant="primary" @click="dialogVisible = true">{{ t('common.addTeam') }}</Win11Button>
            <Win11Button variant="secondary" @click="showCsvUpload = true">{{ t('common.importCsv') }}</Win11Button>
          </div>
        </div>
      </div>
    </Win11Card>

    <Win11Dialog
      v-model="showCsvUpload"
      :title="t('common.importCsv')"
      width="580px"
    >
      <Win11Alert
        :title="t('common.importCsvFormat')"
        :description="t('common.mergeWithExisting')"
        type="info"
        show-icon
        :closable="false"
        class="csv-info-alert"
      />
      <div class="entry-io-dropzone">
        <input
          type="file"
          accept=".csv,.txt"
          @change="handleCsvFileChange"
          class="win11-file-input"
        />
      </div>
    </Win11Dialog>

    <Win11Dialog
      v-model="showImportMenu"
      :title="t('common.importExport')"
      width="560px"
    >
      <div class="entry-io-section">
        <p class="entry-io-section-title">{{ t('common.importFromFile') }}</p>
        <div class="entry-io-row">
          <div class="entry-io-item">
            <div class="entry-io-item-header">
              <label class="win11-form-label">{{ t('common.importCsv') }}</label>
              <Win11Tag size="small">{{ t('common.recommended') }}</Win11Tag>
            </div>
            <div class="entry-io-dropzone">
              <input
                type="file"
                accept=".csv,.txt"
                @change="handleCsvFileChange"
                class="win11-file-input"
              />
            </div>
          </div>
          <div class="entry-io-item">
            <label class="win11-form-label">{{ t('common.importJson') }}</label>
            <div class="entry-io-dropzone">
              <input
                type="file"
                accept=".json"
                @change="handleJsonFileChange"
                class="win11-file-input"
              />
            </div>
          </div>
        </div>
      </div>

      <Win11Divider />

      <div class="entry-io-section">
        <p class="entry-io-section-title">{{ t('common.exportToFile') }}</p>
        <div class="entry-io-export-row">
          <div class="entry-io-export-item">
            <Win11Button variant="secondary" @click="handleExportJson" block>
              {{ t('common.exportJson') }}
            </Win11Button>
            <span class="entry-io-export-hint">JSON</span>
          </div>
          <div class="entry-io-export-item">
            <Win11Button variant="secondary" @click="handleExportCsv" block>
              {{ t('common.exportCsv') }}
            </Win11Button>
            <span class="entry-io-export-hint">CSV</span>
          </div>
        </div>
      </div>

      <template #footer>
        <Win11Button variant="secondary" @click="showImportMenu = false">
          {{ t('common.close') }}
        </Win11Button>
      </template>
    </Win11Dialog>

    <EntryDialog
      v-model:visible="dialogVisible"
      :edit-entry="editingEntry"
      @confirm="handleDialogConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { EntryList, Entry, Driver } from '../types/configuration'
import { t } from '../i18n'
import { isValidSteamId } from '../utils/steamId'
import { Win11Card, Win11Input, Win11Select, Win11Toggle, Win11Button, Win11Dialog, Win11Alert, Win11Divider, Win11Tag, notify } from './win11'
import { parseCSV } from '../utils/csvParser'
import { getCarLocalizedName } from '../i18n/mappings'
import EntryDialog from './EntryDialog.vue'
import EntryListTableView from './entrylist/EntryListTableView.vue'

const props = defineProps<{
  entryList: EntryList
}>()

const emit = defineEmits<{
  'update:entryList': [value: EntryList]
}>()

const searchKeyword = ref('')
const sortBy = ref('teamName')
const sortOrder = ref<'asc' | 'desc'>('asc')
const showImportMenu = ref(false)
const showCsvUpload = ref(false)
const mergeWithExisting = ref(false)
const dialogVisible = ref(false)
const editingEntry = ref<Entry | null>(null)
const editingDriver = ref<Driver | null>(null)
const editingDriverEntry = ref<Entry | null>(null)
const editingDriverIndex = ref<number>(0)
const editingTeamName = ref<Entry | null>(null)
const selectedEntries = ref<Entry[]>([])
const viewMode = ref<'card' | 'table'>('card')
const showHealthIssuesOnly = ref(false)
const expandedEntries = ref<Set<Entry>>(new Set())

const sortOptions = [
  { value: 'teamName', label: t('common.teamNameLabel') },
  { value: 'raceNumber', label: t('common.raceNumberLabel') },
  { value: 'driverCount', label: t('common.driverCountLabel') }
]

const forceEntryListModel = computed({
  get: () => props.entryList.forceEntryList,
  set: (val) => {
    props.entryList.forceEntryList = val
    emit('update:entryList', props.entryList)
  }
})

const filteredEntries = computed(() => {
  let entries = [...props.entryList.entries]

  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    entries = entries.filter(e =>
      e.teamName.toLowerCase().includes(keyword) ||
      e.raceNumber.toString().includes(keyword) ||
      e.drivers.some(d =>
        d.firstName.toLowerCase().includes(keyword) ||
        d.lastName.toLowerCase().includes(keyword) ||
        d.playerID.toLowerCase().includes(keyword)
      )
    )
  }

  if (showHealthIssuesOnly.value) {
    entries = entries.filter(e => entryHealthIssues(e).length > 0)
  }

  entries.sort((a, b) => {
    let comparison = 0
    if (sortBy.value === 'teamName') {
      comparison = a.teamName.localeCompare(b.teamName)
    } else if (sortBy.value === 'raceNumber') {
      comparison = a.raceNumber - b.raceNumber
    } else if (sortBy.value === 'driverCount') {
      comparison = a.drivers.length - b.drivers.length
    }
    return sortOrder.value === 'asc' ? comparison : -comparison
  })

  return entries
})

const totalDrivers = computed(() => {
  return filteredEntries.value.reduce((sum, entry) => sum + entry.drivers.length, 0)
})

function toggleSortOrder() {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
}

function isSelected(entry: Entry): boolean {
  return selectedEntries.value.includes(entry)
}

// ---- 健康检查 ----
function entryHealthIssues(entry: Entry): string[] {
  const issues: string[] = []
  if (!entry.teamName?.trim()) issues.push('teamName-empty')
  if (entry.raceNumber <= 0) issues.push('raceNumber-zero')
  if (entry.drivers.length === 0) issues.push('no-drivers')
  entry.drivers.forEach((d, i) => {
    if (!d.lastName?.trim()) issues.push(`driver-${i}-empty-name`)
    if (d.playerID && !isValidSteamId(d.playerID)) issues.push(`driver-${i}-invalid-steamid`)
  })
  return issues
}

const healthIssueCount = computed(() => {
  return filteredEntries.value.reduce((sum, e) => sum + entryHealthIssues(e).length, 0)
})

const hasHealthIssues = computed(() => healthIssueCount.value > 0)

function isDriversExpanded(entry: Entry): boolean {
  return expandedEntries.value.has(entry)
}

function toggleDriversExpanded(entry: Entry) {
  if (expandedEntries.value.has(entry)) {
    expandedEntries.value.delete(entry)
  } else {
    expandedEntries.value.add(entry)
  }
}

function isDriverHealthy(entry: Entry, index: number): boolean {
  return !entryHealthIssues(entry).some(i => i.startsWith(`driver-${index}`))
}

function toggleSelection(entry: Entry, selected: boolean) {
  if (selected) {
    if (!selectedEntries.value.includes(entry)) {
      selectedEntries.value.push(entry)
    }
  } else {
    selectedEntries.value = selectedEntries.value.filter(e => e !== entry)
  }
}

function handleBatchDelete() {
  selectedEntries.value.forEach(entry => {
    const index = props.entryList.entries.indexOf(entry)
    if (index > -1) {
      props.entryList.entries.splice(index, 1)
    }
  })
  selectedEntries.value = []
  emit('update:entryList', props.entryList)
}

function startEditingTeamName(entry: Entry) {
  editingTeamName.value = entry
}

function getCategoryName(category: number): string {
  const categories: Record<number, string> = {
    0: t('common.categoryPlat'),
    1: t('common.categoryGold'),
    2: t('common.categorySilver'),
    3: t('common.categoryBronze')
  }
  return categories[category] || t('common.categoryUnknown')
}

function editDriver(entry: Entry, driver: Driver, index: number) {
  editingDriver.value = { ...driver }
  editingDriverEntry.value = entry
  editingDriverIndex.value = index
}

function removeDriverFromEntry(entry: Entry, driverIndex: number) {
  entry.drivers.splice(driverIndex, 1)
  emit('update:entryList', props.entryList)
}

function addDriverToEntry(entry: Entry) {
  entry.drivers.push({
    firstName: 'New',
    lastName: 'Driver',
    playerID: '',
    shortName: '',
    driverCategory: 2,
    nationality: 0
  })
  emit('update:entryList', props.entryList)
}

function handleCommand(command: string, entry: Entry, _index: number) {
  if (command === 'edit') {
    editingEntry.value = entry
    dialogVisible.value = true
  } else if (command === 'delete') {
    const entryIndex = props.entryList.entries.indexOf(entry)
    if (entryIndex > -1) {
      props.entryList.entries.splice(entryIndex, 1)
      emit('update:entryList', props.entryList)
    }
  } else if (command === 'duplicate') {
    const newEntry = JSON.parse(JSON.stringify(entry))
    props.entryList.entries.push(newEntry)
    emit('update:entryList', props.entryList)
  } else if (command === 'addDriver') {
    addDriverToEntry(entry)
  }
}

function handleDialogConfirm(newEntry: Entry) {
  if (editingEntry.value) {
    const index = props.entryList.entries.indexOf(editingEntry.value)
    if (index > -1) {
      props.entryList.entries[index] = newEntry
    }
  } else {
    props.entryList.entries.push(newEntry)
  }
  emit('update:entryList', props.entryList)
  editingEntry.value = null
}

function handleCsvFileChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      parseAndImportCsv(content)
    }
    reader.readAsText(file)
  }
}

function handleJsonFileChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const imported = JSON.parse(content) as EntryList
        
        if (mergeWithExisting.value) {
          props.entryList.entries.push(...imported.entries)
        } else {
          props.entryList.entries = imported.entries
        }
        
        if (imported.forceEntryList !== undefined) {
          props.entryList.forceEntryList = imported.forceEntryList
        }
        
        emit('update:entryList', props.entryList)
        showImportMenu.value = false
      } catch (error) {
        console.error('JSON导入错误:', error)
        alert(t('common.jsonImportFailed'))
      }
    }
    reader.readAsText(file)
  }
}

function handleExportJson() {
  const jsonContent = JSON.stringify(props.entryList, null, 2)
  const blob = new Blob([jsonContent], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'entrylist.json'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function handleExportCsv() {
  const headers = [
    'playerID', 'teamName', 'raceNumber', 'defaultGridPosition',
    'firstName', 'lastName', 'shortName', 'overrideDriverInfo',
    'isServerAdmin', 'nationality', 'driverCategory', 'forcedCarModel',
    'ballastKg', 'restrictor'
  ]
  
  const rows: string[][] = []
  
  props.entryList.entries.forEach(entry => {
    entry.drivers.forEach(driver => {
      rows.push([
        driver.playerID || '',
        entry.teamName || '',
        entry.raceNumber.toString() || '',
        entry.defaultGridPosition.toString() || '',
        driver.firstName || '',
        driver.lastName || '',
        driver.shortName || '',
        entry.overrideDriverInfo?.toString() || '1',
        entry.isServerAdmin?.toString() || '0',
        driver.nationality?.toString() || '0',
        driver.driverCategory?.toString() || '0',
        entry.forcedCarModel?.toString() || '-1',
        entry.ballastKg?.toString() || '0',
        entry.restrictor?.toString() || '100'
      ])
    })
  })
  
  const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'entrylist.csv'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function parseAndImportCsv(content: string) {
  const result = parseCSV(content)

  if (result.errors.length > 0) {
    console.error('CSV导入错误:', result.errors)
    notify.error(t('common.importFailed') + ': ' + result.errors.join('; '))
    return
  }

  const importedCount = result.entryList.entries.length
  const warningsCount = result.warnings.length

  if (mergeWithExisting.value) {
    props.entryList.entries.push(...result.entryList.entries)
  } else {
    props.entryList.entries = result.entryList.entries
  }

  emit('update:entryList', props.entryList)
  showCsvUpload.value = false
  showImportMenu.value = false

  // 重置过滤/搜索状态，确保导入后显示全部
  showHealthIssuesOnly.value = false
  searchKeyword.value = ''

  // 导入摘要提示
  const issueCount = props.entryList.entries.reduce(
    (sum, e) => sum + entryHealthIssues(e).length, 0
  )
  const msgParts: string[] = []
  msgParts.push(t('common.importSuccess') + ` (${importedCount} ${t('common.teams')})`)
  if (warningsCount > 0) {
    msgParts.push(warningsCount + ' ' + t('common.warnings'))
  }
  if (issueCount > 0) {
    msgParts.push(issueCount + ' ' + t('common.healthIssues'))
  }
  notify.success(msgParts.join(' | '))
}
</script>

<style scoped>
.win11-toolbar {
  @apply flex items-center justify-between flex-wrap gap-3;
  @apply bg-win11-surface rounded-lg p-4;
}

.win11-toolbar-left {
  @apply flex items-center gap-3 flex-wrap;
}

.win11-toolbar-right {
  @apply flex items-center gap-3;
}

.win11-form-field {
  @apply flex flex-col gap-2;
}

.win11-form-label {
  @apply text-sm font-medium text-win11-text;
}

.win11-toggle-row {
  @apply flex items-center justify-between p-4;
  @apply bg-win11-surface rounded-lg;
}

.win11-toggle-info {
  @apply flex flex-col gap-1;
}

.win11-toggle-label {
  @apply text-sm text-win11-text;
}

.win11-toggle-desc {
  @apply text-xs text-win11-text-secondary;
}

.win11-stat-tag {
  @apply px-3 py-1 rounded-full text-sm;
  @apply bg-win11-surface text-win11-text;
}

.entries-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4;
}

.win11-entry-card {
  @apply p-4 rounded-lg;
  @apply bg-win11-surface border border-win11-border;
  @apply transition-all duration-200;
}

.win11-entry-card:hover {
  @apply border-win11-accent/50;
}

.win11-entry-card.is-selected {
  @apply border-win11-accent bg-win11-accent/5;
}

.entry-card-header {
  @apply flex items-center gap-3 mb-3;
}

.team-info {
  @apply flex-1 flex flex-col gap-1;
}

.team-name {
  @apply font-semibold text-win11-text;
  @apply cursor-pointer hover:text-win11-accent;
}

.team-name-input {
  @apply h-8 text-sm;
}

.race-number {
  @apply font-mono font-bold text-win11-accent;
}

.car-model-badge {
  @apply text-xs px-2 py-0.5 rounded;
  @apply bg-win11-control-bg text-win11-text-secondary;
}

.entry-actions {
  @apply flex items-center gap-1;
}

.drivers-list {
  @apply space-y-2;
}

.win11-driver-expand-btn {
  @apply w-full flex items-center gap-2 p-2 rounded cursor-pointer;
  @apply bg-win11-control-bg hover:bg-win11-control-hover-bg;
  @apply text-win11-text-secondary text-sm;
  @apply transition-all duration-200;
}

.driver-count-badge {
  @apply w-5 h-5 rounded-full bg-win11-accent/20 text-win11-accent text-xs font-bold;
  @apply flex items-center justify-center;
}

.driver-count-label {
  @apply flex-1 text-left;
}

.expand-icon {
  @apply w-4 h-4 transition-transform duration-200;
}

.expand-icon.expanded {
  @apply rotate-180;
}

.health-badge {
  @apply w-5 h-5 rounded-full bg-amber-500/20 text-amber-500;
  @apply flex items-center justify-center;
}

.drivers-list-detail {
  @apply space-y-2 mt-2;
}

.win11-driver-item {
  @apply flex items-center gap-2 p-2 rounded;
  @apply bg-win11-control-bg text-win11-text;
  @apply cursor-pointer hover:bg-win11-control-hover-bg;
}

.category-pill {
  @apply text-xs px-2 py-0.5 rounded-full font-semibold;
}

.category-pill.cat-0 { @apply bg-yellow-500/20 text-yellow-400; }
.category-pill.cat-1 { @apply bg-yellow-400/20 text-yellow-300; }
.category-pill.cat-2 { @apply bg-gray-400/20 text-gray-300; }
.category-pill.cat-3 { @apply bg-amber-600/20 text-amber-400; }

.driver-name {
  @apply flex-1 text-sm;
}

.driver-id {
  @apply text-xs font-mono text-win11-text-secondary;
}

.win11-driver-item.has-issue {
  @apply border border-amber-500/30 bg-amber-500/5;
}

.win11-add-driver-btn {
  @apply w-full flex items-center justify-center gap-2 p-2 mt-2 rounded;
  @apply border border-dashed border-win11-border text-win11-text-secondary;
  @apply hover:border-win11-accent hover:text-win11-accent;
  @apply transition-all duration-200;
}

.win11-empty-state {
  @apply flex flex-col items-center justify-center py-12;
  @apply text-center;
}

.entry-io-section {
  @apply space-y-3;
}

.entry-io-section-title {
  @apply text-sm font-semibold text-win11-text-secondary uppercase tracking-wide;
  @apply px-1;
}

.entry-io-row {
  @apply grid grid-cols-1 gap-3;
}

.entry-io-item {
  @apply flex flex-col gap-2;
}

.entry-io-item-header {
  @apply flex items-center gap-2;
}

.entry-io-dropzone {
  @apply rounded-lg border border-win11-border bg-win11-control-bg;
  @apply transition-colors duration-200;
}

.entry-io-dropzone:hover {
  @apply border-win11-accent;
}

.entry-io-export-row {
  @apply flex gap-3 flex-wrap;
}

.entry-io-export-item {
  @apply flex flex-col items-center gap-1.5 flex-1 min-w-[120px];
}

.entry-io-export-hint {
  @apply text-xs text-win11-text-secondary font-medium uppercase;
}

.csv-info-alert {
  @apply mb-4;
}

.win11-file-input {
  @apply w-full p-4 rounded-lg;
  @apply bg-transparent border-none text-win11-text;
  @apply file:mr-3 file:py-1 file:px-3 file:rounded file:border-0;
  @apply file:text-sm file:font-medium file:text-win11-text file:bg-win11-control-hover-bg;
  @apply file:cursor-pointer file:transition-colors file:duration-150;
  @apply hover:file:bg-win11-surface;
}

.win11-checkbox {
  @apply w-4 h-4 rounded border-2 border-win11-border;
  @apply checked:bg-win11-accent checked:border-win11-accent;
  @apply focus:ring-2 focus:ring-win11-accent/50;
}

.win11-view-toggle {
  @apply flex items-center gap-1 p-1 rounded-lg bg-win11-control-bg;
}

.view-toggle-btn {
  @apply w-8 h-8 rounded-md flex items-center justify-center;
  @apply text-win11-icon hover:text-win11-text hover:bg-win11-surface;
  @apply transition-all duration-200;
}

.view-toggle-btn.active {
  @apply bg-win11-surface text-win11-accent;
}

.win11-button.is-active {
  @apply bg-amber-500/20 text-amber-500 border-amber-500/30;
}

.win11-button.warning {
  @apply bg-amber-500/10 text-amber-500 border border-amber-500/20;
}

.win11-icon-btn {
  @apply w-8 h-8 rounded-md flex items-center justify-center;
  @apply text-win11-icon hover:text-win11-text hover:bg-win11-surface-hover;
  @apply transition-all duration-200;
}

.win11-icon-btn.danger {
  @apply text-win11-icon hover:text-red-500 hover:bg-red-500/10;
}

:root.light .category-pill.cat-0 { @apply bg-yellow-100 text-yellow-800; }
:root.light .category-pill.cat-1 { @apply bg-yellow-50 text-yellow-700; }
:root.light .category-pill.cat-2 { @apply bg-gray-100 text-gray-600; }
:root.light .category-pill.cat-3 { @apply bg-amber-100 text-amber-800; }
</style>
