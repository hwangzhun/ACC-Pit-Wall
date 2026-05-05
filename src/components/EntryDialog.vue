<template>
  <!-- =============================================
       主弹窗：车队信息 + 配置 + 车手列表总览
  ============================================== -->
  <Win11Dialog
    v-model:visible="dialogVisible"
    :title="editEntry ? t('title.editEntry') : t('title.addEntry')"
    width="820px"
    @close="handleClose"
  >
    <div class="entry-dialog-layout">

      <!-- 左侧：车队信息与配置 -->
      <div class="entry-left">
        <!-- 车队核心信息 -->
        <section class="entry-section">
          <h4 class="entry-section-title">{{ t('common.teamInfo') }}</h4>
          <div class="entry-fields">
            <div class="entry-field">
              <label class="entry-label required">{{ t('form.teamName') }}</label>
              <Win11Input
                v-model="entryForm.teamName"
                :placeholder="t('placeholder.inputTeamName')"
              />
            </div>
            <div class="entry-field entry-field--row">
              <div class="entry-field">
                <label class="entry-label">{{ t('form.raceNumber') }}</label>
                <Win11InputNumber v-model="entryForm.raceNumber" :min="0" :max="999" />
              </div>
              <div class="entry-field">
                <label class="entry-label">{{ t('form.defaultGridPosition') }}</label>
                <Win11InputNumber v-model="entryForm.defaultGridPosition" :min="0" :max="60" />
              </div>
            </div>
            <div class="entry-field entry-field--row">
              <div class="entry-field">
                <label class="entry-label">{{ t('form.ballastKg') }}</label>
                <Win11InputNumber v-model="entryForm.ballastKg" :min="0" :max="40" />
              </div>
              <div class="entry-field">
                <label class="entry-label">{{ t('form.restrictor') }}</label>
                <Win11InputNumber v-model="entryForm.restrictor" :min="0" :max="20" />
              </div>
            </div>
            <div class="entry-field">
              <label class="entry-label">{{ t('form.forcedCarModel') }}</label>
              <Win11Select
                v-model="entryForm.forcedCarModel"
                :options="carModelOptionsWithDefault"
                :placeholder="t('common.pleaseSelect')"
                filterable
              />
            </div>
          </div>
        </section>

        <!-- 高级配置 -->
        <section class="entry-section">
          <h4 class="entry-section-title">{{ t('title.advancedSettings') }}</h4>
          <div class="entry-toggles">
            <div class="entry-toggle-row">
              <div class="entry-toggle-info">
                <span class="entry-toggle-label">{{ t('form.isServerAdmin') }}</span>
              </div>
              <Win11Toggle
                :model-value="entryForm.isServerAdmin === 1"
                @update:model-value="entryForm.isServerAdmin = $event ? 1 : 0"
              />
            </div>
            <div class="entry-toggle-row">
              <div class="entry-toggle-info">
                <span class="entry-toggle-label">{{ t('form.overrideDriverInfo') }}</span>
              </div>
              <Win11Toggle
                :model-value="entryForm.overrideDriverInfo === 1"
                @update:model-value="entryForm.overrideDriverInfo = $event ? 1 : 0"
              />
            </div>
          </div>
        </section>
      </div>

      <!-- 右侧：车手列表 -->
      <div class="entry-right">
        <div class="driver-list-header">
          <div class="driver-list-title-group">
            <span class="driver-list-count">{{ entryForm.drivers.length }}</span>
            <span class="driver-list-label">{{ t('common.driverList') }}</span>
          </div>
          <Win11Button variant="primary" size="small" @click="openAddDriver">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            {{ t('common.addDriver') }}
          </Win11Button>
        </div>

        <!-- 空状态 -->
        <div v-if="entryForm.drivers.length === 0" class="driver-list-empty">
          <svg class="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p>{{ t('common.noDrivers') }}</p>
          <span>{{ t('message.clickToAddDriver') }}</span>
        </div>

        <!-- 车手摘要列表 -->
        <div v-else class="driver-summary-list">
          <div
            v-for="(driver, index) in entryForm.drivers"
            :key="index"
            class="driver-summary-card"
            :class="{ 'driver-summary-card--invalid': isDriverSteamIdInvalid(driver.playerID) }"
          >
            <div class="driver-summary-avatar">
              <span class="driver-initial">{{ getDriverInitial(driver) }}</span>
            </div>
            <div class="driver-summary-info">
              <span class="driver-summary-name">
                {{ driver.firstName }} {{ driver.lastName }}
              </span>
              <div class="driver-summary-meta">
                <Win11Tag
                  v-if="getDriverCategoryLabel(driver.driverCategory)"
                  size="small"
                  :type="getDriverCategoryType(driver.driverCategory)"
                >
                  {{ getDriverCategoryLabel(driver.driverCategory) }}
                </Win11Tag>
                <span
                  v-if="isDriverSteamIdInvalid(driver.playerID)"
                  class="driver-summary-steam-error"
                >
                  {{ t('message.invalidSteamId') }}
                </span>
                <span v-else-if="driver.playerID" class="driver-summary-steam">
                  {{ maskSteamId(driver.playerID) }}
                </span>
              </div>
            </div>
            <div class="driver-summary-actions">
              <button class="icon-btn" @click="openEditDriver(index)" :title="t('common.edit')">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
              <button class="icon-btn icon-btn--danger" @click="removeDriver(index)" :title="t('common.delete')">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <Win11Button variant="secondary" @click="handleClose">{{ t('common.cancel') }}</Win11Button>
      <Win11Button variant="primary" @click="handleSubmit">{{ t('common.confirm') }}</Win11Button>
    </template>
  </Win11Dialog>

  <!-- =============================================
       子弹窗：新增 / 编辑车手
  ============================================== -->
  <Win11Dialog
    v-model:visible="driverDialogVisible"
    :title="editingDriverIndex === null ? t('common.addDriver') : t('common.editDriver')"
    width="560px"
    :z-index="2100"
    @close="closeDriverDialog"
  >
    <div class="driver-form">
      <!-- 姓名 -->
      <div class="driver-form-row">
        <div class="driver-form-field">
          <label class="entry-label">{{ t('form.firstName') }}</label>
          <Win11Input v-model="driverDraft.firstName" :placeholder="t('form.firstName')" />
        </div>
        <div class="driver-form-field">
          <label class="entry-label">{{ t('form.lastName') }}</label>
          <Win11Input
            v-model="driverDraft.lastName"
            :placeholder="t('form.lastName')"
            @blur="onDriverLastNameBlur"
          />
        </div>
      </div>

      <!-- 分类 + 国籍 -->
      <div class="driver-form-row">
        <div class="driver-form-field">
          <label class="entry-label">{{ t('common.category') }}</label>
          <Win11Select
            v-model="driverDraft.driverCategory"
            :options="driverLevelOptions"
            :placeholder="t('common.pleaseSelect')"
            filterable
          />
        </div>
        <div class="driver-form-field">
          <label class="entry-label">{{ t('form.nationality') }}</label>
          <Win11Select
            v-model="driverDraft.nationality"
            :options="nationalityOptions"
            :placeholder="t('common.pleaseSelect')"
            filterable
          />
        </div>
      </div>

      <!-- SteamID -->
      <div class="driver-form-field">
        <label class="entry-label">{{ t('form.playerId') }}</label>
        <Win11Input
          v-model="driverDraft.playerID"
          :placeholder="t('placeholder.steamId')"
          maxlength="20"
          :error="steamIdError"
          @blur="onDriverPlayerIdBlur"
        />
        <p v-if="steamIdHint" class="driver-form-hint">{{ steamIdHint }}</p>
      </div>

      <!-- 缩写 -->
      <div class="driver-form-field driver-form-field--short">
        <label class="entry-label">{{ t('form.shortName') }}</label>
        <Win11Input
          v-model="driverDraft.shortName"
          :placeholder="t('form.shortName')"
          maxlength="3"
          show-word-limit
          @update:model-value="(v: string) => (driverDraft.shortName = normalizeShortNameInput(v))"
        />
      </div>
    </div>

    <template #footer>
      <Win11Button variant="secondary" @click="closeDriverDialog">{{ t('common.cancel') }}</Win11Button>
      <Win11Button variant="primary" @click="saveDriver">{{ t('common.save') }}</Win11Button>
    </template>
  </Win11Dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import type { Entry, Driver } from '../types/configuration'
import { driverCategories } from '../data/mappings'
import { t } from '../i18n'
import { getNationalitySelectOptionsI18n, getCarModelSelectOptionsForEntry } from '../i18n/mappings'
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
} from '../utils/steamId'
import {
  Win11Dialog,
  Win11Input,
  Win11Select,
  Win11Toggle,
  Win11Button,
  Win11InputNumber,
  Win11Tag,
  notify
} from './win11'

const props = defineProps<{
  editEntry?: Entry | null
}>()

const dialogVisible = defineModel<boolean>('visible', { default: false })

const emit = defineEmits<{
  confirm: [entry: Entry]
  close: []
}>()

// ---- 车队表单 ----
const entryForm = reactive<Entry>({
  teamName: '',
  raceNumber: 0,
  defaultGridPosition: 0,
  ballastKg: 0,
  restrictor: 0,
  isServerAdmin: 0,
  forcedCarModel: -1,
  overrideCarModelForCustomCar: 0,
  overrideDriverInfo: 1,
  customCar: '',
  drivers: []
})

watch(() => props.editEntry, (newVal) => {
  if (newVal) {
    Object.assign(entryForm, {
      teamName: newVal.teamName,
      raceNumber: newVal.raceNumber,
      defaultGridPosition: newVal.defaultGridPosition,
      ballastKg: newVal.ballastKg,
      restrictor: newVal.restrictor,
      isServerAdmin: newVal.isServerAdmin,
      forcedCarModel: newVal.forcedCarModel,
      overrideCarModelForCustomCar: newVal.overrideCarModelForCustomCar,
      overrideDriverInfo: newVal.overrideDriverInfo,
      customCar: newVal.customCar,
      drivers: newVal.drivers.map((d: Driver) => ({ ...d }))
    })
  } else {
    resetForm()
  }
}, { immediate: true })

// ---- 下拉选项 ----
const carModelOptions = computed(() => getCarModelSelectOptionsForEntry())
const carModelOptionsWithDefault = computed(() => [
  { value: -1, label: t('options.notForced') },
  ...carModelOptions.value
])

const driverLevelOptions = Object.entries(driverCategories)
  .map(([value, label]) => ({
    value: Number(value),
    label: `${value} - ${label}`
  }))
  .sort((a, b) => a.value - b.value)

const nationalityOptions = computed(() =>
  getNationalitySelectOptionsI18n().map(opt => ({ value: opt.value, label: opt.name }))
)

// ---- 子弹窗状态 ----
const driverDialogVisible = ref(false)
const editingDriverIndex = ref<number | null>(null)

const driverDraft = reactive<Driver>({
  driverCategory: 0,
  firstName: '',
  lastName: '',
  playerID: '',
  shortName: '',
  nationality: 0
})

// ---- 子弹窗 SteamID 实时提示 ----
const steamIdHint = computed(() => {
  const pid = driverDraft.playerID
  if (!pid) return ''
  if (isSteamIdTooShort(pid)) {
    return t('message.steamIdTooShort').replace('{count}', String(getSteamIdDigitCount(pid)))
  }
  if (isSteamIdTooLong(pid)) {
    return t('message.steamIdTooLong').replace('{count}', String(getSteamIdDigitCount(pid)))
  }
  return ''
})

const steamIdError = computed(() => {
  return isDriverSteamIdInvalid(driverDraft.playerID) ? t('message.invalidSteamId') : undefined
})

function steamIdSubmitErrorMessage(pid: string): string {
  if (isSteamIdTooShort(pid)) {
    return t('message.steamIdTooShort').replace('{count}', String(getSteamIdDigitCount(pid)))
  }
  if (isSteamIdTooLong(pid)) {
    return t('message.steamIdTooLong').replace('{count}', String(getSteamIdDigitCount(pid)))
  }
  return t('message.invalidSteamId')
}

// ---- 子弹窗操作 ----
function openAddDriver() {
  editingDriverIndex.value = null
  Object.assign(driverDraft, { driverCategory: 0, firstName: '', lastName: '', playerID: '', shortName: '', nationality: 0 })
  driverDialogVisible.value = true
}

function openEditDriver(index: number) {
  editingDriverIndex.value = index
  const d = entryForm.drivers[index]
  Object.assign(driverDraft, { ...d })
  driverDialogVisible.value = true
}

function closeDriverDialog() {
  driverDialogVisible.value = false
  editingDriverIndex.value = null
}

function saveDriver() {
  driverDraft.playerID = normalizeSteamId(driverDraft.playerID || '')
  const req = requireValidSteamIdForDriver(driverDraft.playerID)
  if (!req.ok) {
    if (req.reason === 'empty') {
      notify.warning(t('message.pleaseInputDriverSteamId'))
    } else {
      notify.warning(steamIdSubmitErrorMessage(driverDraft.playerID))
    }
    return
  }

  driverDraft.playerID = req.normalized

  if (!driverDraft.shortName?.trim() && driverDraft.lastName) {
    driverDraft.shortName = defaultShortNameFromLastName(driverDraft.lastName)
  }

  if (editingDriverIndex.value !== null) {
    entryForm.drivers[editingDriverIndex.value] = { ...driverDraft }
  } else {
    entryForm.drivers.push({ ...driverDraft })
  }
  closeDriverDialog()
}

// ---- 车手辅助函数 ----
function getDriverCategoryLabel(category: number): string {
  return driverCategories[category] || ''
}

function getDriverCategoryType(category: number): 'primary' | 'success' | 'warning' | 'danger' | 'info' {
  const types: Record<number, 'primary' | 'success' | 'warning' | 'danger' | 'info'> = {
    0: 'info', 1: 'warning', 2: 'success', 3: 'danger', 4: 'primary'
  }
  return types[category] || 'info'
}

function getDriverInitial(driver: Driver): string {
  if (driver.firstName) return driver.firstName[0].toUpperCase()
  if (driver.lastName) return driver.lastName[0].toUpperCase()
  return '?'
}

function maskSteamId(id: string): string {
  if (id.length <= 6) return id
  return id.slice(0, 3) + '***' + id.slice(-3)
}

function onDriverLastNameBlur() {
  if (!driverDraft.shortName?.trim()) {
    driverDraft.shortName = defaultShortNameFromLastName(driverDraft.lastName)
  }
}

function onDriverPlayerIdBlur() {
  driverDraft.playerID = normalizeSteamId(driverDraft.playerID || '')
}

function removeDriver(index: number) {
  entryForm.drivers.splice(index, 1)
}

function resetForm() {
  entryForm.teamName = ''
  entryForm.raceNumber = 0
  entryForm.defaultGridPosition = 0
  entryForm.ballastKg = 0
  entryForm.restrictor = 0
  entryForm.isServerAdmin = 0
  entryForm.forcedCarModel = -1
  entryForm.overrideCarModelForCustomCar = 0
  entryForm.overrideDriverInfo = 1
  entryForm.customCar = ''
  entryForm.drivers = []
}

function handleClose() {
  closeDriverDialog()
  resetForm()
  dialogVisible.value = false
  emit('close')
}

async function handleSubmit() {
  if (entryForm.drivers.length === 0) {
    notify.warning(t('message.pleaseAddAtLeastOneDriver'))
    return
  }

  for (const d of entryForm.drivers) {
    d.shortName = normalizeShortNameInput(d.shortName || '')
    const req = requireValidSteamIdForDriver(d.playerID)
    if (!req.ok) {
      if (req.reason === 'empty') {
        notify.warning(t('message.pleaseInputDriverSteamId'))
      } else {
        notify.warning(steamIdSubmitErrorMessage(d.playerID))
      }
      return
    }
    d.playerID = req.normalized
  }

  dialogVisible.value = false
  emit('confirm', { ...entryForm })
}
</script>

<style scoped>
/* ---- 主弹窗布局 ---- */
.entry-dialog-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  align-items: start;
}

@media (max-width: 720px) {
  .entry-dialog-layout {
    grid-template-columns: 1fr;
  }
}

.entry-left {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.entry-right {
  background: color-mix(in srgb, var(--win11-control-bg) 40%, transparent);
  border: 1px solid var(--win11-border);
  border-radius: 10px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 200px;
}

/* ---- 区块标题 ---- */
.entry-section-title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--win11-text-secondary);
  margin: 0 0 12px 0;
}

/* ---- 字段 ---- */
.entry-fields {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.entry-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.entry-field--row {
  flex-direction: row;
  gap: 12px;
}

.entry-field--row .entry-field {
  flex: 1;
}

.entry-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--win11-text-secondary);
}

.entry-label.required::after {
  content: ' *';
  color: rgb(var(--win11-error-text-rgb));
}

/* ---- 开关行 ---- */
.entry-toggles {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.entry-toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid color-mix(in srgb, var(--win11-border) 50%, transparent);
}

.entry-toggle-row:last-child {
  border-bottom: none;
}

.entry-toggle-label {
  font-size: 13px;
  color: var(--win11-text);
}

/* ---- 车手列表头部 ---- */
.driver-list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.driver-list-title-group {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.driver-list-count {
  font-size: 22px;
  font-weight: 700;
  color: var(--win11-text);
  line-height: 1;
}

.driver-list-label {
  font-size: 12px;
  color: var(--win11-text-secondary);
}

/* ---- 空状态 ---- */
.driver-list-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: var(--win11-text-secondary);
  padding: 24px 0;
}

.driver-list-empty p {
  margin: 0;
  font-size: 13px;
  font-weight: 500;
  color: var(--win11-text);
}

.driver-list-empty span {
  font-size: 11px;
}

/* ---- 车手摘要卡片 ---- */
.driver-summary-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.driver-summary-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 10px;
  background: var(--win11-surface);
  border: 1px solid var(--win11-border);
  border-radius: 8px;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.driver-summary-card:hover {
  border-color: color-mix(in srgb, var(--win11-accent) 50%, transparent);
  box-shadow: 0 2px 8px color-mix(in srgb, var(--win11-shadow-dialog) 30%, transparent);
}

.driver-summary-card--invalid {
  border-color: color-mix(in srgb, var(--win11-error-text-rgb) 50%, transparent);
}

.driver-summary-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--win11-accent) 15%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.driver-initial {
  font-size: 13px;
  font-weight: 700;
  color: var(--win11-accent);
}

.driver-summary-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.driver-summary-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--win11-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.driver-summary-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.driver-summary-steam {
  font-size: 11px;
  font-family: 'Consolas', monospace;
  color: var(--win11-text-secondary);
}

.driver-summary-steam-error {
  font-size: 11px;
  color: rgb(var(--win11-error-text-rgb));
}

.driver-summary-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

/* ---- 图标按钮 ---- */
.icon-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--win11-icon);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, color 0.15s;
}

.icon-btn:hover {
  background: var(--win11-control-hover-bg);
  color: var(--win11-text);
}

.icon-btn--danger:hover {
  background: color-mix(in srgb, #ef4444 15%, transparent);
  color: #ef4444;
}

/* ---- 子弹窗表单 ---- */
.driver-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.driver-form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.driver-form-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.driver-form-field--short {
  max-width: 120px;
}

.driver-form-hint {
  font-size: 11px;
  color: rgb(var(--win11-warning-text-rgb));
  margin: 2px 0 0 0;
}
</style>
