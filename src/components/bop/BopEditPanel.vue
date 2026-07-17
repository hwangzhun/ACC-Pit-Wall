<template>
  <div class="bop-edit-panel">
    <div class="panel-header">
      <h4>{{ t('title.editBop') }}</h4>
    </div>

    <div class="panel-content">
      <div class="car-preview-card">
        <div class="car-preview-layout">
          <div class="car-thumb-wrap">
            <div class="car-thumb-frame">
              <img
                v-if="carPreviewSrc && !carPreviewError"
                :src="carPreviewSrc"
                alt=""
                class="car-thumb-img"
                loading="lazy"
                @error="carPreviewError = true"
                @load="carPreviewError = false"
              />
              <div v-else class="car-thumb-placeholder">
                <svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
          <div class="car-info-aside">
            <div class="car-info-track">
              <svg class="car-info-track-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{{ formatTrackName(formData.track) }}</span>
            </div>
            <div class="car-name">{{ getCarName(formData.carModel) }}</div>
            <div class="car-info-sub">
              <span class="car-id">ID {{ formData.carModel }}</span>
              <Win11Tag :type="getCarClassType(formData.carModel)" size="small">
                {{ getCarClass(formData.carModel) }}
              </Win11Tag>
            </div>
          </div>
        </div>
      </div>

      <div class="edit-form">
        <div class="win11-form-field">
          <label class="win11-form-label">{{ t('form.track') }}</label>
          <Win11Select
            v-model="formData.track"
            :options="trackOptions"
            :placeholder="t('common.pleaseSelect')"
            filterable
            style="width: 100%"
          />
        </div>

        <div class="win11-form-field">
          <label class="win11-form-label">{{ t('form.carModel') }}</label>
          <Win11Select
            v-model="formData.carModel"
            :options="carModelOptions"
            :placeholder="t('common.pleaseSelect')"
            filterable
            style="width: 100%"
          />
        </div>

        <div class="win11-form-field">
          <div class="field-label-row">
            <span class="win11-form-label">{{ t('form.ballastKg') }}</span>
            <div class="label-right">
              <Win11InputNumber
                v-model="formData.ballastKg"
                :min="-40"
                :max="40"
              />
              <Win11Tag
                :type="formData.ballastKg > 0 ? 'danger' : formData.ballastKg < 0 ? 'success' : 'info'"
                size="small"
              >
                {{ formData.ballastKg > 0 ? `+${formData.ballastKg}kg` : formData.ballastKg < 0 ? `${formData.ballastKg}kg` : t('bop.standard') }}
              </Win11Tag>
            </div>
          </div>
          <Win11Slider
            v-model="formData.ballastKg"
            :min="-40"
            :max="40"
            :color="getBallastColor(formData.ballastKg)"
          />
        </div>

        <div class="win11-form-field">
          <div class="field-label-row">
            <span class="win11-form-label">{{ t('bop.restrictor') }}</span>
            <div class="label-right">
              <Win11InputNumber
                v-model="formData.restrictor"
                :min="0"
                :max="20"
              />
              <Win11Tag :type="restrictorDisplay === 0 ? 'success' : 'warning'" size="small">
                {{
                  restrictorDisplay === 0
                    ? t('bop.noRestriction')
                    : t('bop.restricted').replace('{value}', String(restrictorDisplay))
                }}
              </Win11Tag>
            </div>
          </div>
          <Win11Slider
            v-model="formData.restrictor"
            :min="0"
            :max="20"
            :color="getRestrictorColor(restrictorDisplay)"
          />
        </div>
      </div>
    </div>

    <div class="panel-footer">
      <Win11Button variant="secondary" @click="handleCancel">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
        {{ t('common.cancel') }}
      </Win11Button>
      <Win11Button variant="primary" @click="handleSave">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        {{ t('common.save') }}
      </Win11Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch, computed, ref } from 'vue'
import type { BopEntry } from '../../types/configuration'
import { carModels, getCarImageUrl } from '../../data/mappings'
import { clampAccBopRestrictor } from '../../utils/lfmBopService'
import { TRACKS } from '../../types/defaults'
import { useTrackName, getCarLocalizedName } from '../../i18n/mappings'
import { getCarClass } from './utils'
import { t } from '../../i18n'
import {
  Win11Button,
  Win11Tag,
  Win11Select,
  Win11InputNumber,
  Win11Slider
} from '../win11'

const props = defineProps<{
  entry: BopEntry
}>()

const emit = defineEmits<{
  (e: 'save', entry: BopEntry): void
  (e: 'cancel'): void
}>()

const formData = reactive<BopEntry>({
  track: 'monza',
  carModel: 0,
  ballastKg: 0,
  restrictor: 0
})

const restrictorDisplay = computed(() => clampAccBopRestrictor(formData.restrictor))

const carPreviewError = ref(false)
const carPreviewSrc = computed(() => getCarImageUrl(formData.carModel) || '')

watch(
  () => formData.carModel,
  () => {
    carPreviewError.value = false
  }
)

const trackOptions = computed(() => {
  const set = new Set<string>(TRACKS)
  const cur = formData.track?.trim()
  if (cur) set.add(cur)
  return [...set].sort((a, b) => a.localeCompare(b)).map(key => ({
    value: key,
    label: useTrackName(key).value
  }))
})

const carModelOptions = computed(() => {
  return Object.keys(carModels)
    .map(k => Number(k))
    .map(v => ({ value: v, label: getCarLocalizedName(v) }))
    .sort((a, b) => a.value - b.value)
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

function getCarName(carId: number): string {
  return getCarLocalizedName(carId)
}

function getCarClassType(carModel: number): 'primary' | 'success' | 'warning' | 'info' {
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
  background: var(--win11-surface);
}

.panel-header {
  padding: 14px 16px;
  border-bottom: 1px solid var(--win11-border);
  flex-shrink: 0;
}

.panel-header h4 {
  margin: 0;
  font-size: var(--type-body);
  font-weight: var(--weight-emphasis);
  color: var(--win11-text);
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
  border-top: 1px solid var(--win11-border);
  background: var(--win11-surface);
}

.car-preview-card {
  border-radius: 10px;
  border: 1px solid var(--win11-border);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  background: var(--win11-surface);
}

.car-preview-layout {
  display: flex;
  align-items: stretch;
  gap: 16px;
  padding: 14px 16px;
}

.car-thumb-wrap {
  flex-shrink: 0;
}

.car-thumb-frame {
  width: 132px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  background: var(--win11-control-bg);
  border: 1px solid var(--win11-border);
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.car-thumb-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
  display: block;
}

.car-thumb-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--win11-text-secondary);
}

.car-info-aside {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
}

.car-info-track {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: var(--type-caption);
  font-weight: var(--weight-emphasis);
  color: var(--win11-text-secondary);
}

.car-info-track-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  opacity: 0.85;
}

.car-name {
  font-size: var(--type-section);
  font-weight: var(--weight-emphasis);
  color: var(--win11-text);
  line-height: 1.35;
  word-break: break-word;
}

.car-info-sub {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.car-id {
  font-size: var(--type-caption);
  color: var(--win11-text-secondary);
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.win11-form-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.win11-form-label {
  font-size: var(--type-body);
  font-weight: var(--weight-emphasis);
  color: var(--win11-text);
}

.field-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.label-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
