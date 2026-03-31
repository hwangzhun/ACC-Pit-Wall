<template>
  <div class="bop-edit-panel">
    <div class="panel-header">
      <h4>{{ t('title.editBop') }}</h4>
    </div>

    <div class="panel-content">
      <!-- 车型预览卡片 -->
      <div class="car-preview-card">
        <div class="image-wrapper">
          <el-image
            :src="getCarImageUrl(formData.carModel)"
            class="car-image"
            fit="cover"
            @error="handleImageError"
          >
            <template #error>
              <div class="image-placeholder">
                <el-icon :size="36"><Picture /></el-icon>
              </div>
            </template>
          </el-image>
          <!-- 赛道标签叠加在图片左上角 -->
          <div class="track-badge">
            <el-icon :size="11"><Location /></el-icon>
            {{ formatTrackName(formData.track) }}
          </div>
        </div>
        <div class="car-info-row">
          <div class="car-name-block">
            <span class="car-name">{{ getCarName(formData.carModel) }}</span>
            <span class="car-id">ID {{ formData.carModel }}</span>
          </div>
          <el-tag :type="getCarClassType(formData.carModel)" size="small" class="car-class-tag">
            {{ getCarClass(formData.carModel) }}
          </el-tag>
        </div>
      </div>

      <!-- 编辑表单 -->
      <el-form ref="formRef" :model="formData" label-position="top" class="edit-form">
        <!-- 赛道（与 TRACK_NAMES 一致） -->
        <el-form-item :label="t('form.track')">
          <el-select
            v-model="formData.track"
            :placeholder="t('common.pleaseSelect')"
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="key in trackSelectKeys"
              :key="key"
              :label="formatTrackName(key)"
              :value="key"
            />
          </el-select>
        </el-form-item>

        <!-- 车型选择 -->
        <el-form-item :label="t('form.carModel')">
          <el-select v-model="formData.carModel" :placeholder="t('common.pleaseSelect')" filterable style="width: 100%">
            <el-option-group label="GT3">
              <el-option v-for="car in gt3Cars" :key="car.value" :label="car.label" :value="car.value" />
            </el-option-group>
            <el-option-group label="GT4">
              <el-option v-for="car in gt4Cars" :key="car.value" :label="car.label" :value="car.value" />
            </el-option-group>
            <el-option-group label="GT2">
              <el-option v-for="car in gt2Cars" :key="car.value" :label="car.label" :value="car.value" />
            </el-option-group>
          </el-select>
        </el-form-item>

        <!-- 配重 -->
        <el-form-item>
          <template #label>
            <div class="field-label-row">
              <span>{{ t('form.ballastKg') }}</span>
              <div class="label-right">
                <el-input-number
                  v-model="formData.ballastKg"
                  :min="-40"
                  :max="40"
                  :step="1"
                  controls-position="right"
                  size="small"
                  style="width: 100px"
                />
                <el-tag
                  :type="formData.ballastKg > 0 ? 'danger' : formData.ballastKg < 0 ? 'success' : 'info'"
                  size="small"
                >
                  {{ formData.ballastKg > 0 ? `+${formData.ballastKg}kg` : formData.ballastKg < 0 ? `${formData.ballastKg}kg` : t('bop.standard') }}
                </el-tag>
              </div>
            </div>
          </template>
          <el-slider
            v-model="formData.ballastKg"
            :min="-40"
            :max="40"
            :step="1"
            :color="getBallastColor(formData.ballastKg)"
          />
        </el-form-item>

        <!-- 进气限制器 -->
        <el-form-item>
          <template #label>
            <div class="field-label-row">
              <span>{{ t('bop.restrictor') }}</span>
              <div class="label-right">
                <el-input-number
                  v-model="formData.restrictor"
                  :min="0"
                  :max="20"
                  :step="1"
                  controls-position="right"
                  size="small"
                  style="width: 100px"
                />
                <el-tag :type="restrictorDisplay === 0 ? 'success' : 'warning'" size="small">
                  {{
                    restrictorDisplay === 0
                      ? t('bop.noRestriction')
                      : t('bop.restricted').replace('{value}', String(restrictorDisplay))
                  }}
                </el-tag>
              </div>
            </div>
          </template>
          <el-slider
            v-model="formData.restrictor"
            :min="0"
            :max="20"
            :step="1"
            :color="getRestrictorColor(restrictorDisplay)"
          />
        </el-form-item>
      </el-form>
    </div>

    <div class="panel-footer">
      <el-button size="default" @click="handleCancel">
        <el-icon><Close /></el-icon>
        {{ t('common.cancel') }}
      </el-button>
      <el-button type="primary" size="default" @click="handleSave">
        <el-icon><Check /></el-icon>
        {{ t('common.save') }}
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import { Check, Close, Picture, Location } from '@element-plus/icons-vue'
import type { FormInstance } from 'element-plus'
import type { BopEntry } from '../../types/configuration'
import { carModels, getCarImageUrl } from '../../data/mappings'
import { clampAccBopRestrictor } from '../../utils/lfmBopService'
import { TRACKS } from '../../types/defaults'
import { useTrackName, getCarLocalizedName } from '../../i18n/mappings'
import { getCarClass } from './composables/useBopFilter'
import { t } from '../../i18n'

const props = defineProps<{
  entry: BopEntry
}>()

const emit = defineEmits<{
  (e: 'save', entry: BopEntry): void
  (e: 'cancel'): void
}>()

const formRef = ref<FormInstance>()
const formData = reactive<BopEntry>({
  track: 'monza',
  carModel: 0,
  ballastKg: 0,
  restrictor: 0
})

/** ACC 限制器 0–20；不完整数据时归一化 */
const restrictorDisplay = computed(() => clampAccBopRestrictor(formData.restrictor))

/** 赛道选项：TRACK_NAMES 的 key（TRACKS），并保留当前条目不在表内时的值 */
const trackSelectKeys = computed(() => {
  const set = new Set<string>(TRACKS)
  const cur = formData.track?.trim()
  if (cur) set.add(cur)
  return [...set].sort((a, b) => a.localeCompare(b))
})

function applyEntryToForm(entry: BopEntry) {
  formData.track = entry.track ?? 'monza'
  formData.carModel = Number(entry.carModel ?? 0)
  formData.ballastKg = Number(entry.ballastKg ?? 0)
  formData.restrictor = clampAccBopRestrictor(entry.restrictor ?? 0)
}

watch(() => props.entry, (newVal) => {
  if (newVal) {
    applyEntryToForm(newVal)
  }
}, { immediate: true, deep: true })

watch(
  () => formData.restrictor,
  (v) => {
    if (v == null || Number.isNaN(Number(v))) {
      formData.restrictor = 0
      return
    }
    const c = clampAccBopRestrictor(v)
    if (c !== v) {
      formData.restrictor = c
    }
  }
)

watch(
  () => formData.ballastKg,
  (v) => {
    if (v == null || Number.isNaN(Number(v))) {
      formData.ballastKg = 0
    }
  }
)

// 车型选项分组（文案随界面语言变化，下拉已 filterable）
const gt3Cars = computed(() =>
  Object.keys(carModels)
    .map((k) => Number(k))
    .filter((id) => getCarClass(id) === 'GT3')
    .map((v) => ({ value: v, label: getCarLocalizedName(v) }))
    .sort((a, b) => a.value - b.value)
)

const gt4Cars = computed(() =>
  Object.keys(carModels)
    .map((k) => Number(k))
    .filter((id) => getCarClass(id) === 'GT4')
    .map((v) => ({ value: v, label: getCarLocalizedName(v) }))
    .sort((a, b) => a.value - b.value)
)

const gt2Cars = computed(() =>
  Object.keys(carModels)
    .map((k) => Number(k))
    .filter((id) => getCarClass(id) === 'GT2')
    .map((v) => ({ value: v, label: getCarLocalizedName(v) }))
    .sort((a, b) => a.value - b.value)
)

function getCarName(carId: number): string {
  return getCarLocalizedName(carId)
}

function getCarClassType(carModel: number): string {
  const cls = getCarClass(carModel)
  switch (cls) {
    case 'GT3': return 'primary'
    case 'GT4': return 'success'
    case 'GT2': return 'warning'
    default: return 'info'
  }
}

function formatTrackName(track: string): string {
  return useTrackName(track).value
}

function getBallastColor(ballast: number): string {
  if (ballast > 0) return '#f56c6c'
  if (ballast < 0) return '#67c23a'
  return '#909399'
}

function getRestrictorColor(restrictor: number): string {
  const r = clampAccBopRestrictor(restrictor)
  if (r === 0) return '#67c23a'
  if (r <= 10) return '#e6a23c'
  return '#f56c6c'
}

function handleImageError() {}

function handleSave() {
  emit('save', {
    ...formData,
    restrictor: clampAccBopRestrictor(formData.restrictor)
  })
}

function handleCancel() {
  emit('cancel')
}
</script>

<style scoped>
.bop-edit-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--el-bg-color);
}

.panel-header {
  padding: 14px 16px;
  border-bottom: 1px solid var(--el-border-color-light);
  flex-shrink: 0;
}

.panel-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.panel-content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.panel-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
  padding: 12px 16px;
  border-top: 1px solid var(--el-border-color-light);
  background: var(--el-bg-color);
}

/* 车型预览卡片 */
.car-preview-card {
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-light);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.image-wrapper {
  position: relative;
}

.car-image {
  width: 100%;
  height: 120px;
  display: block;
  background: linear-gradient(135deg, var(--el-fill-color) 0%, var(--el-fill-color-dark) 100%);
}

.image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-placeholder);
  background: linear-gradient(135deg, var(--el-fill-color) 0%, var(--el-fill-color-dark) 100%);
}

/* 赛道标签叠加 */
.track-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
  color: #fff;
  font-size: 11px;
  font-weight: 500;
  border-radius: 20px;
  line-height: 1.4;
}

.car-info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: var(--el-bg-color);
}

.car-name-block {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.car-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.car-id {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

.car-class-tag {
  flex-shrink: 0;
}

/* 表单 */
.edit-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.edit-form :deep(.el-form-item) {
  margin-bottom: 0;
}

.edit-form :deep(.el-form-item__label) {
  padding-bottom: 6px;
  width: 100%;
}

/* label 行：左侧文字 + 右侧输入框和 Tag */
.field-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.label-right {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* 滑块 */
:deep(.el-slider) {
  padding: 0 4px;
}

:deep(.el-slider__runway) {
  margin: 10px 0 6px;
}
</style>
