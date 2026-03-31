<template>
  <div class="event-form">
    <!-- 赛道和天气 -->
    <el-card class="section-card">
      <template #header>
        <h3>{{ t('form.trackAndWeather') }}</h3>
      </template>
      <el-form :model="event" label-width="180px">
        <el-form-item :label="t('form.track')">
          <el-select v-model="event.track" :placeholder="t('common.pleaseSelect')" filterable>
            <el-option v-for="track in trackOptions" :key="track.value" :label="track.label" :value="track.value" />
          </el-select>
          <FieldDescription config-name="event" field-name="track" />
        </el-form-item>
        <el-form-item :label="t('form.ambientTemp')">
          <el-input-number v-model="event.ambientTemp" :min="-20" :max="40" />
          <FieldDescription config-name="event" field-name="ambientTemp" />
        </el-form-item>
        <el-form-item :label="t('form.cloudLevel')">
          <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
            <el-slider v-model="event.cloudLevel" :min="0" :max="1" :step="0.1" :format-tooltip="formatCloudLevel" style="flex: 1;" />
            <span style="min-width: 40px; text-align: right;">{{ event.cloudLevel }}</span>
          </div>
          <FieldDescription config-name="event" field-name="cloudLevel" />
        </el-form-item>
        <el-form-item :label="t('form.rain')">
          <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
            <el-slider v-model="event.rain" :min="0" :max="1" :step="0.1" :format-tooltip="formatRainLevel" style="flex: 1;" />
            <span style="min-width: 40px; text-align: right;">{{ event.rain }}</span>
          </div>
          <FieldDescription config-name="event" field-name="rain" />
        </el-form-item>
        <el-form-item :label="t('form.weatherRandomness')">
          <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
            <el-slider v-model="event.weatherRandomness" :min="0" :max="7" :step="1" :format-tooltip="formatWeatherRandomness" style="flex: 1;" />
            <span style="min-width: 40px; text-align: right;">{{ event.weatherRandomness }}</span>
          </div>
          <FieldDescription config-name="event" field-name="weatherRandomness" />
        </el-form-item>
        <el-form-item :label="t('form.isFixedConditionQualification')">
          <el-switch v-model="event.isFixedConditionQualification" :active-value="1" :inactive-value="0" />
          <FieldDescription config-name="event" field-name="isFixedConditionQualification" />
        </el-form-item>
        <el-form-item :label="t('form.simracerWeatherConditions')">
          <el-switch v-model="event.simracerWeatherConditions" :active-value="1" :inactive-value="0" />
          <FieldDescription config-name="event" field-name="simracerWeatherConditions" />
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 时间设置 -->
    <el-card class="section-card">
      <template #header>
        <h3>{{ t('form.timeSettings') }}</h3>
      </template>
      <el-form :model="event" label-width="220px">
        <el-form-item :label="t('form.preRaceWaitingTimeSeconds')">
          <el-input-number v-model="event.preRaceWaitingTimeSeconds" :min="0" />
          <FieldDescription config-name="event" field-name="preRaceWaitingTimeSeconds" />
        </el-form-item>
        <el-form-item :label="t('form.postQualySeconds')">
          <el-input-number v-model="event.postQualySeconds" :min="0" />
          <FieldDescription config-name="event" field-name="postQualySeconds" />
        </el-form-item>
        <el-form-item :label="t('form.postRaceSeconds')">
          <el-input-number v-model="event.postRaceSeconds" :min="0" />
          <FieldDescription config-name="event" field-name="postRaceSeconds" />
        </el-form-item>
        <el-form-item :label="t('form.sessionOverTimeSeconds')">
          <el-input-number v-model="event.sessionOverTimeSeconds" :min="0" />
          <FieldDescription config-name="event" field-name="sessionOverTimeSeconds" />
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 赛事会话阶段 -->
    <el-card class="section-card">
      <template #header>
        <h3>{{ t('form.sessions') }}</h3>
      </template>
      <div class="sessions-list">
        <div v-for="(session, index) in event.sessions" :key="index" class="session-item">
          <el-card>
            <template #header>
              <div class="session-header">
                <span>{{ sessionCardTitle(session.sessionType, index) }}</span>
                <el-button
                  type="danger"
                  size="small"
                  :icon="Delete"
                  circle
                  @click="removeSession(index)"
                />
              </div>
            </template>
            <el-form :model="session" label-width="150px">
              <el-form-item :label="t('form.sessionType')">
                <el-select v-model="session.sessionType" :placeholder="t('common.pleaseSelect')" filterable>
                  <el-option :label="t('sessionTypes.practice')" value="P" />
                  <el-option :label="t('sessionTypes.qualify')" value="Q" />
                  <el-option :label="t('sessionTypes.race')" value="R" />
                </el-select>
              </el-form-item>
              <el-form-item :label="t('form.dayOfWeekend')">
                <el-select v-model="session.dayOfWeekend" :placeholder="t('common.pleaseSelect')" filterable>
                  <el-option :label="t('daysOfWeekend.friday')" :value="1" />
                  <el-option :label="t('daysOfWeekend.saturday')" :value="2" />
                  <el-option :label="t('daysOfWeekend.sunday')" :value="3" />
                </el-select>
              </el-form-item>
              <el-form-item :label="t('form.timeOfDay')">
                <el-select v-model="session.hourOfDay" :placeholder="t('common.pleaseSelect')" filterable>
                  <el-option v-for="hour in 24" :key="hour" :label="`${hour - 1}:00`" :value="hour - 1" />
                </el-select>
              </el-form-item>
              <el-form-item :label="t('form.sessionDurationMinutes')">
                <el-input-number v-model="session.sessionDurationMinutes" :min="1" />
              </el-form-item>
              <el-form-item :label="t('form.timeMultiplier')">
                <el-input-number v-model="session.timeMultiplier" :min="1" :max="24" />
              </el-form-item>
            </el-form>
          </el-card>
        </div>
        <el-button type="primary" :icon="Plus" @click="addSession">{{ t('common.add') }}</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Delete, Plus } from '@element-plus/icons-vue'
import type { Event as EventType } from '../types/configuration'
import { getTrackOptions } from '../i18n/mappings'
import FieldDescription from './FieldDescription.vue'
import { t } from '../i18n'

const props = defineProps<{
  event: EventType
}>()

const trackOptions = computed(() => getTrackOptions())

function formatCloudLevel(value: number): string {
  if (value === 0) return t('weather.clear')
  if (value < 0.3) return t('weather.lightCloud')
  if (value < 0.6) return t('weather.mediumCloud')
  if (value < 0.8) return t('weather.heavyCloud')
  return t('weather.heavyCloud')
}

function formatRainLevel(value: number): string {
  if (value === 0) return t('weather.clear')
  if (value < 0.3) return t('weather.lightRain')
  if (value < 0.6) return t('weather.mediumRain')
  if (value < 0.8) return t('weather.heavyRain')
  return t('weather.thunderstorm')
}

function formatWeatherRandomness(value: number): string {
  if (value === 0) return t('weatherRandomness.disabled')
  if (value <= 2) return t('weatherRandomness.realistic')
  if (value <= 5) return t('weatherRandomness.variable')
  return t('weatherRandomness.chaotic')
}

function getSessionTypeName(type: string): string {
  switch (type) {
    case 'P':
      return t('sessionTypes.practice')
    case 'Q':
      return t('sessionTypes.qualify')
    case 'R':
      return t('sessionTypes.race')
    default:
      return type
  }
}

function nthSessionLabel(index: number): string {
  return t('form.nthSession').replace('{n}', String(index + 1))
}

/** 卡片标题按列表顺序（第几场），与 dayOfWeekend / 时刻无关 */
function sessionCardTitle(sessionType: string, index: number): string {
  return `${getSessionTypeName(sessionType)} - ${nthSessionLabel(index)}`
}

function addSession() {
  props.event.sessions.push({
    dayOfWeekend: 2,
    hourOfDay: 14,
    sessionDurationMinutes: 60,
    sessionType: 'P',
    timeMultiplier: 1
  })
}

function removeSession(index: number) {
  props.event.sessions.splice(index, 1)
}
</script>

<style scoped>
.event-form {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.section-card {
  margin-bottom: 0;
}

.sessions-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.session-item {
  margin-bottom: 16px;
}

.session-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.el-form-item {
  margin-bottom: 12px;
}

.section-card :deep(h3) {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

:deep(.field-description) {
  margin-left: 8px;
}
</style>
