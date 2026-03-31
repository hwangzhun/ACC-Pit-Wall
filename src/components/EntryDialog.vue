<template>
  <el-dialog
    v-model="dialogVisible"
    :title="editEntry ? t('title.editEntry') : t('title.addEntry')"
    width="900px"
    @close="handleClose"
  >
    <el-form ref="formRef" :model="entryForm" :rules="rules" label-width="120px">
      <el-divider content-position="left">{{ t('common.teamInfo') }}</el-divider>
      
      <el-form-item :label="t('form.teamName')" prop="teamName">
        <el-input v-model="entryForm.teamName" :placeholder="t('placeholder.inputTeamName')" />
      </el-form-item>
      
      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item :label="t('form.raceNumber')">
            <el-input-number v-model="entryForm.raceNumber" :min="0" :max="999" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item :label="t('form.defaultGridPosition')">
            <el-input-number v-model="entryForm.defaultGridPosition" :min="0" :max="60" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item :label="t('form.ballastKg')">
            <el-input-number v-model="entryForm.ballastKg" :min="0" :max="40" />
          </el-form-item>
        </el-col>
      </el-row>
      
      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item :label="t('form.restrictor')">
            <el-input-number v-model="entryForm.restrictor" :min="0" :max="20" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item :label="t('form.forcedCarModel')">
            <el-select v-model="entryForm.forcedCarModel" :placeholder="t('common.pleaseSelect')" filterable clearable style="width: 100%;">
              <el-option :label="t('options.notForced')" :value="-1" />
              <el-option
                v-for="car in carModelOptions"
                :key="car.value"
                :label="car.label"
                :value="car.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item :label="t('form.isServerAdmin')">
            <el-switch v-model="entryForm.isServerAdmin" :active-value="1" :inactive-value="0" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item :label="t('form.overrideDriverInfo')">
            <el-switch v-model="entryForm.overrideDriverInfo" :active-value="1" :inactive-value="0" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-divider content-position="left">{{ t('common.driverList') }}</el-divider>
      
      <div class="drivers-actions">
        <el-button type="primary" size="small" :icon="Plus" @click="addDriver">
          {{ t('common.addDriver') }}
        </el-button>
      </div>

      <el-empty v-if="entryForm.drivers.length === 0" :description="t('common.noDrivers')" />

      <el-collapse v-model="activeDrivers" v-else>
        <el-collapse-item
          v-for="(driver, index) in entryForm.drivers"
          :key="index"
          :name="index"
          :class="{ 'collapse-driver-steamid-invalid': isDriverSteamIdInvalid(driver.playerID) }"
        >
          <template #title>
            <div
              class="driver-title"
              :class="{ 'driver-title--steamid-invalid': isDriverSteamIdInvalid(driver.playerID) }"
            >
              <span>{{ driver.firstName }} {{ driver.lastName || t('common.unnamed') }}</span>
              <el-button
                type="danger"
                size="small"
                :icon="Delete"
                circle
                @click.stop="removeDriver(index)"
              />
            </div>
          </template>

          <el-form :model="driver" label-width="100px" size="small">
            <el-row :gutter="15">
              <el-col :span="12">
                <el-form-item :label="t('common.category')">
                  <el-select v-model="driver.driverCategory" :placeholder="t('common.pleaseSelect')" filterable style="width: 100%;">
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
                  <el-select v-model="driver.nationality" :placeholder="t('common.pleaseSelect')" filterable style="width: 100%;">
                    <el-option
                      v-for="nation in nationalityOptions"
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

            <el-row :gutter="15">
              <el-col :span="12">
                <el-form-item :label="t('form.firstName')" prop="firstName">
                  <el-input v-model="driver.firstName" :placeholder="t('form.firstName')" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item :label="t('form.lastName')">
                  <el-input
                    v-model="driver.lastName"
                    :placeholder="t('form.lastName')"
                    @blur="onDriverLastNameBlur(driver)"
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="15">
              <el-col :span="12">
                <el-form-item
                  :label="t('form.playerId')"
                  :class="{ 'form-item-steamid-invalid': isDriverSteamIdInvalid(driver.playerID) }"
                >
                  <el-input
                    v-model="driver.playerID"
                    :placeholder="t('placeholder.steamId')"
                    maxlength="20"
                    @blur="onDriverPlayerIdBlur(driver)"
                  />
                  <div
                    v-if="isSteamIdTooShort(driver.playerID)"
                    class="steamid-field-hint steamid-field-hint--warning"
                  >
                    {{ steamIdTooShortText(driver.playerID) }}
                  </div>
                  <div
                    v-else-if="isSteamIdTooLong(driver.playerID)"
                    class="steamid-field-hint steamid-field-hint--warning"
                  >
                    {{ steamIdTooLongText(driver.playerID) }}
                  </div>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item :label="t('form.shortName')">
                  <el-input
                    :model-value="driver.shortName"
                    :placeholder="t('form.shortName')"
                    maxlength="3"
                    show-word-limit
                    @update:model-value="(v: string) => (driver.shortName = normalizeShortNameInput(v))"
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-collapse-item>
      </el-collapse>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">{{ t('common.cancel') }}</el-button>
      <el-button type="primary" @click="handleSubmit">{{ t('common.confirm') }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import { Delete, Plus } from '@element-plus/icons-vue'
import type { Entry, Driver } from '../types/configuration'
import type { FormInstance } from 'element-plus'
import { ElMessage } from 'element-plus'
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

const props = defineProps<{
  editEntry?: Entry | null
}>()

const dialogVisible = defineModel<boolean>('visible', { default: false })

const emit = defineEmits<{
  confirm: [entry: Entry]
  close: []
}>()

const formRef = ref<FormInstance>()
const activeDrivers = ref<number[]>([])

const carModelOptions = computed(() => getCarModelSelectOptionsForEntry())

const driverLevelOptions = Object.entries(driverCategories)
  .map(([value, label]) => ({
    value: Number(value),
    label: `${value} - ${label}`,
  }))
  .sort((a, b) => a.value - b.value)

const nationalityOptions = computed(() => getNationalitySelectOptionsI18n())

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

const rules = {
  teamName: [{ required: true, message: t('message.pleaseInputTeamName'), trigger: 'blur' }]
}

// 监听编辑模式
watch(() => props.editEntry, (newVal) => {
  if (newVal) {
    // 编辑模式：复制数据到表单
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
    // 新增模式：重置表单
    resetForm()
  }
}, { immediate: true })

function onDriverLastNameBlur(driver: Driver) {
  if (!driver.shortName?.trim()) {
    driver.shortName = defaultShortNameFromLastName(driver.lastName)
  }
}

function steamIdTooShortText(pid: string | undefined) {
  return t('message.steamIdTooShort').replace(
    '{count}',
    String(getSteamIdDigitCount(pid))
  )
}

function steamIdTooLongText(pid: string | undefined) {
  return t('message.steamIdTooLong').replace(
    '{count}',
    String(getSteamIdDigitCount(pid))
  )
}

function steamIdSubmitErrorMessage(pid: string): string {
  if (isSteamIdTooShort(pid)) return steamIdTooShortText(pid)
  if (isSteamIdTooLong(pid)) return steamIdTooLongText(pid)
  return t('message.invalidSteamId')
}

function onDriverPlayerIdBlur(driver: Driver) {
  driver.playerID = normalizeSteamId(driver.playerID || '')
  const pid = driver.playerID
  if (isSteamIdTooShort(pid)) {
    ElMessage.warning(steamIdTooShortText(pid))
  } else if (isSteamIdTooLong(pid)) {
    ElMessage.warning(steamIdTooLongText(pid))
  }
}

function addDriver() {
  entryForm.drivers.push({
    driverCategory: 0,
    firstName: '',
    lastName: '',
    playerID: '',
    shortName: '',
    nationality: 0
  })
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
  activeDrivers.value = []
  formRef.value?.resetFields()
}

function handleClose() {
  resetForm()
  dialogVisible.value = false
  // 通知父组件编辑已结束
  emit('close')
}

async function handleSubmit() {
  if (!formRef.value) return

  try {
    await formRef.value.validate()

    if (entryForm.drivers.length === 0) {
      ElMessage.warning(t('message.pleaseAddAtLeastOneDriver'))
      return
    }

    for (const d of entryForm.drivers) {
      d.shortName = normalizeShortNameInput(d.shortName || '')
      const req = requireValidSteamIdForDriver(d.playerID)
      if (!req.ok) {
        if (req.reason === 'empty') {
          ElMessage.error(t('message.steamIdRequired'))
        } else {
          d.playerID = req.normalized
          ElMessage.error(steamIdSubmitErrorMessage(d.playerID))
        }
        return
      }
      d.playerID = req.normalized
    }

    emit('confirm', { ...entryForm })
    handleClose()
  } catch (error) {
    console.error('表单验证失败:', error)
  }
}
</script>

<style scoped>
.driver-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.drivers-actions {
  margin-bottom: 12px;
}

:deep(.el-form-item__label) {
  white-space: nowrap;
}

.form-item-steamid-invalid :deep(.el-input__wrapper) {
  box-shadow: 0 0 0 1px var(--el-color-danger) inset;
}

:deep(.collapse-driver-steamid-invalid .el-collapse-item__header) {
  background: color-mix(in srgb, var(--el-color-danger) 10%, transparent);
}

.driver-title--steamid-invalid span:first-child {
  color: var(--el-color-danger);
  font-weight: 600;
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

.steamid-field-hint {
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.4;
}

.steamid-field-hint--warning {
  color: var(--el-color-warning);
}
</style>
