<template>
  <Win11Dialog
    v-model="dialogVisible"
    :title="t('deploy.uploadConfirmTitle')"
    width="640px"
    :z-index="2100"
    :close-on-click-modal="false"
    :close-on-press-escape="true"
    @close="handleCancel"
  >
    <div class="confirm-body">
      <p class="confirm-hint">
        <svg class="hint-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {{ t('deploy.eventConfigSecondConfirm') }}
      </p>

      <!-- Overview Section -->
      <section class="confirm-section overview-section">
        <h4 class="section-title">
          <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {{ t('deploy.confirmSectionOverview') }}
        </h4>
        <div class="kv-grid">
          <div class="kv-row">
            <span class="kv-label">{{ t('deploy.confirmServerName') }}</span>
            <span class="kv-value">{{ configs.settings.serverName || '-' }}</span>
          </div>
          <div class="kv-row">
            <span class="kv-label">{{ t('deploy.confirmTrack') }}</span>
            <span class="kv-value highlight">{{ configs.event.track || '-' }}</span>
          </div>
          <div class="kv-row">
            <span class="kv-label">{{ t('deploy.confirmCarGroup') }}</span>
            <span class="kv-value">{{ configs.settings.carGroup || '-' }}</span>
          </div>
          <div class="kv-row">
            <span class="kv-label">{{ t('deploy.confirmMaxSlots') }}</span>
            <span class="kv-value">{{ configs.settings.maxCarSlots }}</span>
          </div>
        </div>
      </section>

      <!-- Weather Section -->
      <section class="confirm-section weather-section">
        <h4 class="section-title">
          <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
          </svg>
          {{ t('deploy.confirmSectionWeather') }}
        </h4>
        <div class="kv-grid">
          <div class="kv-row">
            <span class="kv-label">{{ t('deploy.confirmAmbientTemp') }}</span>
            <span class="kv-value">{{ configs.event.ambientTemp }}°C</span>
          </div>
          <div class="kv-row">
            <span class="kv-label">{{ t('deploy.confirmCloudLevel') }}</span>
            <span class="kv-value">{{ formatPercent(configs.event.cloudLevel) }}</span>
          </div>
          <div class="kv-row">
            <span class="kv-label">{{ t('deploy.confirmRain') }}</span>
            <span class="kv-value">{{ formatPercent(configs.event.rain) }}</span>
          </div>
          <div class="kv-row">
            <span class="kv-label">{{ t('deploy.confirmWeatherRandomness') }}</span>
            <span class="kv-value">{{ configs.event.weatherRandomness }}</span>
          </div>
        </div>
      </section>

      <!-- Sessions Section -->
      <section class="confirm-section sessions-section">
        <h4 class="section-title">
          <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {{ t('deploy.confirmSectionSessions') }}
        </h4>
        <div class="sessions-table">
          <div class="sessions-header">
            <span>#</span>
            <span>{{ t('deploy.confirmSession') }}</span>
            <span>{{ t('deploy.confirmDay') }}</span>
            <span>{{ t('deploy.confirmStartHour') }}</span>
            <span>{{ t('deploy.confirmDuration') }}</span>
            <span>{{ t('deploy.confirmTimeMultiplier') }}</span>
          </div>
          <div
            v-for="(session, index) in configs.event.sessions"
            :key="index"
            class="sessions-row"
          >
            <span class="session-index">{{ index + 1 }}</span>
            <span class="session-type">{{ session.sessionType }}</span>
            <span>{{ session.dayOfWeekend }}</span>
            <span>{{ session.hourOfDay }}:00</span>
            <span>{{ session.sessionDurationMinutes }}m</span>
            <span>x{{ session.timeMultiplier }}</span>
          </div>
        </div>
      </section>

      <!-- Rules Section -->
      <section class="confirm-section rules-section">
        <h4 class="section-title">
          <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          {{ t('deploy.confirmSectionRules') }}
        </h4>
        <div class="kv-grid">
          <div class="kv-row">
            <span class="kv-label">{{ t('deploy.confirmMandatoryPitstopCount') }}</span>
            <span class="kv-value">{{ configs.eventRules.mandatoryPitstopCount }}</span>
          </div>
          <div class="kv-row">
            <span class="kv-label">{{ t('deploy.confirmPitWindowLengthSec') }}</span>
            <span class="kv-value">{{ configs.eventRules.pitWindowLengthSec }}s</span>
          </div>
          <div class="kv-row">
            <span class="kv-label">{{ t('deploy.confirmDriverStintTimeSec') }}</span>
            <span class="kv-value">{{ formatDuration(configs.eventRules.driverStintTimeSec) }}</span>
          </div>
          <div class="kv-row">
            <span class="kv-label">{{ t('deploy.confirmTyreSetCount') }}</span>
            <span class="kv-value">{{ configs.eventRules.tyreSetCount }}</span>
          </div>
          <div class="kv-row">
            <span class="kv-label">{{ t('deploy.confirmRefuellingAllowedInRace') }}</span>
            <span class="kv-value" :class="boolClass(configs.eventRules.isRefuellingAllowedInRace)">{{ formatBool(configs.eventRules.isRefuellingAllowedInRace) }}</span>
          </div>
          <div class="kv-row">
            <span class="kv-label">{{ t('deploy.confirmRefuellingTimeFixed') }}</span>
            <span class="kv-value" :class="boolClass(configs.eventRules.isRefuellingTimeFixed)">{{ formatBool(configs.eventRules.isRefuellingTimeFixed) }}</span>
          </div>
          <div class="kv-row">
            <span class="kv-label">{{ t('deploy.confirmMandatoryPitstopRefuellingRequired') }}</span>
            <span class="kv-value" :class="boolClass(configs.eventRules.isMandatoryPitstopRefuellingRequired)">{{ formatBool(configs.eventRules.isMandatoryPitstopRefuellingRequired) }}</span>
          </div>
          <div class="kv-row">
            <span class="kv-label">{{ t('deploy.confirmMandatoryPitstopTyreChangeRequired') }}</span>
            <span class="kv-value" :class="boolClass(configs.eventRules.isMandatoryPitstopTyreChangeRequired)">{{ formatBool(configs.eventRules.isMandatoryPitstopTyreChangeRequired) }}</span>
          </div>
          <div class="kv-row">
            <span class="kv-label">{{ t('deploy.confirmMandatoryPitstopSwapDriverRequired') }}</span>
            <span class="kv-value" :class="boolClass(configs.eventRules.isMandatoryPitstopSwapDriverRequired)">{{ formatBool(configs.eventRules.isMandatoryPitstopSwapDriverRequired) }}</span>
          </div>
        </div>
      </section>
    </div>

    <template #footer>
      <Win11Button variant="secondary" @click="handleCancel">
        {{ t('common.cancel') }}
      </Win11Button>
      <Win11Button variant="primary" :loading="loading" @click="handleConfirm">
        {{ t('deploy.confirmUpload') }}
      </Win11Button>
    </template>
  </Win11Dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { t } from '../../i18n'
import { Win11Dialog, Win11Button } from '../win11'
import type { AllConfigs } from '../../types/configuration'

const props = defineProps<{
  modelValue: boolean
  configs: AllConfigs
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'confirm': []
  'cancel': []
}>()

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

function formatBool(value: boolean): string {
  return value ? t('deploy.confirmYes') : t('deploy.confirmNo')
}

function boolClass(value: boolean): string {
  return value ? 'bool-yes' : 'bool-no'
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`
}

function formatDuration(seconds: number): string {
  if (seconds >= 3600) {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`
  }
  if (seconds >= 60) {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}m ${s}s`
  }
  return `${seconds}s`
}

function handleConfirm() {
  emit('confirm')
}

function handleCancel() {
  emit('cancel')
  dialogVisible.value = false
}
</script>

<style scoped>
.confirm-body {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.confirm-hint {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 0 0 16px 0;
  padding: 10px 12px;
  background: rgba(255, 140, 0, 0.08);
  border: 1px solid rgba(255, 140, 0, 0.2);
  border-radius: 8px;
  font-size: var(--type-body);
  color: var(--win11-text-secondary);
  line-height: 1.5;
}

.hint-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  margin-top: 1px;
  color: #ff8c00;
}

.confirm-section {
  margin-bottom: 16px;
}

.confirm-section:last-child {
  margin-bottom: 0;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 10px 0;
  font-size: var(--type-body);
  font-weight: var(--weight-emphasis);
  color: var(--win11-accent);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.section-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.kv-grid {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: var(--win11-control-bg);
  border-radius: 8px;
  padding: 8px 12px;
}

.kv-row {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 8px;
  align-items: center;
  min-height: 26px;
}

.kv-row:not(:last-child) {
  border-bottom: 1px solid var(--win11-border);
  padding-bottom: 4px;
  margin-bottom: 0;
}

.kv-label {
  font-size: var(--type-caption);
  color: var(--win11-text-secondary);
}

.kv-value {
  font-size: var(--type-body);
  color: var(--win11-text);
  font-weight: var(--weight-emphasis);
  text-align: right;
}

.kv-value.highlight {
  color: var(--win11-accent);
  font-weight: var(--weight-emphasis);
}

.kv-value.bool-yes {
  color: #107c10;
}

.kv-value.bool-no {
  color: var(--win11-text-secondary);
}

/* Sessions Table */
.sessions-table {
  background: var(--win11-control-bg);
  border-radius: 8px;
  overflow: hidden;
  font-size: var(--type-caption);
}

.sessions-header {
  display: grid;
  grid-template-columns: 32px 56px 1fr 1fr 1fr 1fr;
  gap: 4px;
  padding: 8px 12px;
  background: var(--win11-control-hover-bg);
  font-weight: var(--weight-emphasis);
  color: var(--win11-text-secondary);
  text-transform: uppercase;
  font-size: var(--type-caption);
  letter-spacing: 0.04em;
}

.sessions-header span {
  text-align: center;
}

.sessions-row {
  display: grid;
  grid-template-columns: 32px 56px 1fr 1fr 1fr 1fr;
  gap: 4px;
  padding: 7px 12px;
  align-items: center;
  border-top: 1px solid var(--win11-border);
  color: var(--win11-text);
}

.sessions-row span {
  text-align: center;
}

.session-index {
  font-weight: var(--weight-emphasis);
  color: var(--win11-text-secondary);
  font-size: var(--type-caption);
}

.session-type {
  font-weight: var(--weight-emphasis);
  color: var(--win11-accent);
  font-size: var(--type-caption);
}
/* Visual hierarchy: summaries, metrics and switches are intentionally distinct. */
.overview-section .kv-grid,
.weather-section .kv-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  padding: 0;
  background: transparent;
}

.overview-section .kv-row,
.weather-section .kv-row {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 5px;
  min-height: 68px;
  padding: 11px 13px;
  margin: 0;
  border: 1px solid var(--win11-border);
  border-radius: 10px;
  background: var(--win11-control-bg);
}

.overview-section .kv-row:not(:last-child),
.weather-section .kv-row:not(:last-child) {
  padding-bottom: 11px;
  margin-bottom: 0;
  border-bottom: 1px solid var(--win11-border);
}

.overview-section .kv-value,
.weather-section .kv-value {
  width: 100%;
  text-align: left;
  font-size: var(--type-heading);
  line-height: 1.2;
}

.overview-section .kv-row:nth-child(2) {
  border-color: color-mix(in srgb, var(--win11-accent) 42%, var(--win11-border));
  background: linear-gradient(135deg, color-mix(in srgb, var(--win11-accent) 10%, transparent), var(--win11-control-bg));
}

.weather-section .kv-row {
  position: relative;
  padding-left: 42px;
}

.weather-section .kv-row::before {
  position: absolute;
  left: 13px;
  width: 20px;
  height: 20px;
  display: grid;
  place-items: center;
  border-radius: 6px;
  background: color-mix(in srgb, var(--win11-accent) 12%, transparent);
  color: var(--win11-accent);
  font-size: var(--type-caption);
  font-weight: var(--weight-emphasis);
}
.weather-section .kv-row:nth-child(1)::before { content: '°'; }
.weather-section .kv-row:nth-child(2)::before { content: '☁'; }
.weather-section .kv-row:nth-child(3)::before { content: '◆'; }
.weather-section .kv-row:nth-child(4)::before { content: '↝'; }

.sessions-section .sessions-table {
  padding: 8px;
  background: color-mix(in srgb, var(--win11-control-bg) 70%, transparent);
  border: 1px solid var(--win11-border);
}
.sessions-section .sessions-header { border-radius: 7px; }
.sessions-section .sessions-row {
  margin-top: 6px;
  border: 1px solid var(--win11-border);
  border-radius: 8px;
  background: var(--win11-control-bg);
}

.rules-section .kv-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  padding: 0;
  background: transparent;
}
.rules-section .kv-row {
  display: flex;
  min-height: 58px;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-start;
  gap: 6px;
  padding: 10px 11px;
  margin: 0;
  border: 1px solid var(--win11-border);
  border-radius: 9px;
  background: var(--win11-control-bg);
}
.rules-section .kv-row:not(:last-child) {
  padding-bottom: 10px;
  margin-bottom: 0;
  border-bottom: 1px solid var(--win11-border);
}
.rules-section .kv-label { line-height: 1.35; }
.rules-section .kv-value { width: 100%; text-align: left; font-size: var(--type-section); }
.rules-section .kv-value.bool-yes,
.rules-section .kv-value.bool-no {
  width: auto;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: var(--type-caption);
  background: color-mix(in srgb, currentColor 10%, transparent);
}

@media (max-width: 680px) {
  .rules-section .kv-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
</style>
