<template>
  <div class="event-form">
    <Win11Card>
      <template #title>
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-md bg-win11-accent/10 flex items-center justify-center">
            <svg class="w-5 h-5 text-win11-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
            </svg>
          </div>
          <div>
            <h3 class="text-base font-semibold text-win11-text m-0">{{ t('form.trackAndWeather') }}</h3>
            <p class="text-xs text-win11-text-secondary m-0">{{ t('eventPage.weatherSubtitle') }}</p>
          </div>
        </div>
      </template>

      <div class="space-y-6">
        <div class="event-summary summary-cards">
          <div><span>{{ t('form.track') }}</span><strong>{{ selectedTrackLabel }}</strong></div>
          <div><span>{{ t('form.ambientTemp') }}</span><strong>{{ event.ambientTemp }}°C</strong></div>
          <div><span>{{ t('eventPage.conditionsGroup') }}</span><strong>{{ weatherLabel }}</strong></div>
          <div><span>{{ t('form.sessions') }}</span><strong>{{ event.sessions.length }}</strong></div>
          <div><span>{{ t('form.sessionDurationMinutes') }}</span><strong>{{ totalSessionMinutes }} min</strong></div>
        </div>
        <div class="win11-form-grid cols-2">
          <div class="win11-form-field">
            <label class="win11-form-label">{{ t('form.track') }}</label>
            <Win11Select
              v-model="event.track"
              :options="trackOptions"
            />
          </div>

          <div class="win11-form-field">
            <label class="win11-form-label">{{ t('form.ambientTemp') }} °C</label>
            <Win11Input
              v-model.number="event.ambientTemp"
              type="number"
            />
          </div>
        </div>

        <div class="space-y-4">
          <div class="win11-form-field">
            <Win11Slider
              v-model="event.cloudLevel"
              :label="t('form.cloudLevel')"
              :min="0"
              :max="1"
              :step="0.1"
            />
          </div>

          <div class="win11-form-field">
            <Win11Slider
              v-model="event.rain"
              :label="t('form.rain')"
              :min="0"
              :max="1"
              :step="0.1"
            />
          </div>

          <div class="win11-form-field">
            <Win11Slider
              v-model="event.weatherRandomness"
              :label="t('form.weatherRandomness')"
              :min="0"
              :max="7"
              :step="1"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="win11-toggle-row">
            <div class="win11-toggle-info">
              <span class="win11-toggle-label">{{ t('form.isFixedConditionQualification') }}</span>
              <span class="win11-toggle-desc">{{ t('eventPage.fixedQualificationDescription') }}</span>
            </div>
            <Win11Toggle
              :model-value="event.isFixedConditionQualification === 1"
              @update:model-value="event.isFixedConditionQualification = toFlag($event)"
            />
          </div>

          <div class="win11-toggle-row">
            <div class="win11-toggle-info">
              <span class="win11-toggle-label">{{ t('form.simracerWeatherConditions') }}</span>
              <span class="win11-toggle-desc">{{ t('eventPage.simracerDescription') }}</span>
            </div>
            <Win11Toggle
              :model-value="event.simracerWeatherConditions === 1"
              @update:model-value="event.simracerWeatherConditions = toFlag($event)"
            />
          </div>
        </div>
      </div>
    </Win11Card>

    <Win11Card>
      <template #title>
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-md bg-win11-accent/10 flex items-center justify-center">
            <svg class="w-5 h-5 text-win11-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 class="text-base font-semibold text-win11-text m-0">{{ t('form.timeSettings') }}</h3>
            <p class="text-xs text-win11-text-secondary m-0">{{ t('eventPage.timingSubtitle') }}</p>
          </div>
        </div>
      </template>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="win11-form-field">
          <label class="win11-form-label">{{ t('form.preRaceWaitingTimeSeconds') }}</label>
          <Win11Input
            v-model.number="event.preRaceWaitingTimeSeconds"
            type="number"
          />
        </div>

        <div class="win11-form-field">
          <label class="win11-form-label">{{ t('form.postQualySeconds') }}</label>
          <Win11Input
            v-model.number="event.postQualySeconds"
            type="number"
          />
        </div>

        <div class="win11-form-field">
          <label class="win11-form-label">{{ t('form.postRaceSeconds') }}</label>
          <Win11Input
            v-model.number="event.postRaceSeconds"
            type="number"
          />
        </div>

        <div class="win11-form-field">
          <label class="win11-form-label">{{ t('form.sessionOverTimeSeconds') }}</label>
          <Win11Input
            v-model.number="event.sessionOverTimeSeconds"
            type="number"
          />
        </div>
      </div>
    </Win11Card>

    <Win11Card>
      <template #title>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-md bg-win11-accent/10 flex items-center justify-center">
              <svg class="w-5 h-5 text-win11-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 class="text-base font-semibold text-win11-text m-0">{{ t('form.sessions') }}</h3>
              <p class="text-xs text-win11-text-secondary m-0">{{ sessionSummary }}</p>
            </div>
          </div>
          <Win11Button @click="addSession" variant="primary">
            + {{ t('eventPage.addSession') }}
          </Win11Button>
        </div>
      </template>

      <div v-if="event.sessions.length" class="space-y-4">
        <div v-for="(session, index) in event.sessions" :key="index"
             class="win11-session-card">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-md bg-win11-accent flex items-center justify-center text-white font-semibold text-sm">
                {{ index + 1 }}
              </div>
              <h4 class="text-base font-semibold text-win11-text">{{ sessionCardTitle(session.sessionType, index) }}</h4>
            </div>
            <button @click="removeSession(index)" class="win11-button-icon text-red-500 hover:text-red-400">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>

          <div class="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div class="win11-form-field">
              <label class="win11-form-label">{{ t('form.sessionType') }}</label>
              <Win11Select
                v-model="session.sessionType"
                :options="sessionTypeOptions"
              />
            </div>

            <div class="win11-form-field">
              <label class="win11-form-label">{{ t('form.dayOfWeekend') }}</label>
              <Win11Select
                v-model="session.dayOfWeekend"
                :options="dayOfWeekendOptions"
              />
            </div>

            <div class="win11-form-field">
              <label class="win11-form-label">{{ t('form.timeOfDay') }}</label>
              <Win11Select
                v-model="session.hourOfDay"
                :options="hourOptions"
              />
            </div>

            <div class="win11-form-field">
              <label class="win11-form-label">{{ t('form.sessionDurationMinutes') }}</label>
              <Win11Input
                v-model.number="session.sessionDurationMinutes"
                type="number"
              />
            </div>

            <div class="win11-form-field">
              <label class="win11-form-label">{{ t('form.timeMultiplier') }}</label>
              <Win11Input
                v-model.number="session.timeMultiplier"
                type="number"
              />
            </div>
          </div>
        </div>
      </div>
      <div v-else class="event-empty-state">
        <strong>{{ t('eventPage.noSessions') }}</strong>
        <p>{{ t('eventPage.noSessionsDescription') }}</p>
        <Win11Button variant="primary" @click="addSession">+ {{ t('eventPage.addFirstSession') }}</Win11Button>
      </div>
    </Win11Card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Event as EventType } from '../types/configuration'
import { getTrackOptions } from '../i18n/mappings'
import { t } from '../i18n'
import { Win11Card, Win11Input, Win11Select, Win11Toggle, Win11Slider, Win11Button } from './win11'

const props = defineProps<{
  event: EventType
}>()

const trackOptions = computed(() => getTrackOptions())
const selectedTrackLabel = computed(() => trackOptions.value.find(option => option.value === props.event.track)?.label || props.event.track)
const totalSessionMinutes = computed(() => props.event.sessions.reduce((sum, session) => sum + Math.max(0, Number(session.sessionDurationMinutes) || 0), 0))
const sessionSummary = computed(() => props.event.sessions.length
  ? t('eventPage.sessionSummary').replace('{count}', String(props.event.sessions.length)).replace('{minutes}', String(totalSessionMinutes.value))
  : t('eventPage.sessionsSubtitle'))
const weatherLabel = computed(() => {
  if (props.event.rain >= 0.7) return t('weather.heavyRain')
  if (props.event.rain >= 0.35) return t('weather.mediumRain')
  if (props.event.rain > 0) return t('weather.lightRain')
  if (props.event.cloudLevel >= 0.75) return t('weather.heavyCloud')
  if (props.event.cloudLevel >= 0.4) return t('weather.mediumCloud')
  if (props.event.cloudLevel > 0.1) return t('weather.lightCloud')
  return t('weather.clear')
})

const sessionTypeOptions = computed(() => [
  { label: t('sessionTypes.practice'), value: 'P' },
  { label: t('sessionTypes.qualify'), value: 'Q' },
  { label: t('sessionTypes.race'), value: 'R' }
])

const dayOfWeekendOptions = computed(() => [
  { label: t('daysOfWeekend.friday'), value: 1 },
  { label: t('daysOfWeekend.saturday'), value: 2 },
  { label: t('daysOfWeekend.sunday'), value: 3 }
])

const hourOptions = computed(() =>
  Array.from({ length: 24 }, (_, i) => ({
    label: `${String(i).padStart(2, '0')}:00`,
    value: i
  }))
)

function toFlag(value: boolean | number): number { return value === true || value === 1 ? 1 : 0 }

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
.event-summary{display:flex;flex-wrap:wrap;gap:7px}
.event-summary span{font-size: var(--type-caption);font-weight: var(--weight-emphasis);color:var(--win11-text)}
.event-summary span+span:before{content:'·';margin-right:7px;color:var(--win11-text-secondary)}
.weather-panel{padding:14px;border:1px solid var(--win11-border);border-radius:10px;background:var(--win11-surface)}
.weather-panel-heading{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px}
.weather-panel-heading h4{margin:0 0 3px;font-size: var(--type-body);color:var(--win11-text)}
.weather-panel-heading p{margin:0;font-size: var(--type-caption);color:var(--win11-text-secondary)}
.weather-panel-heading>span{padding:4px 9px;border-radius:999px;background:color-mix(in srgb,var(--win11-accent) 12%,transparent);color:var(--win11-accent);font-size: var(--type-caption);font-weight: var(--weight-emphasis)}
.event-empty-state{padding:28px;text-align:center;border:1px dashed var(--win11-border);border-radius:10px;color:var(--win11-text)}
.event-empty-state p{margin:5px 0 14px;font-size: var(--type-caption);color:var(--win11-text-secondary)}
.win11-form-field {
  @apply flex flex-col gap-2;
}

.win11-toggle-row {
  @apply flex items-center justify-between py-3;
  @apply border-b border-win11-border;
}

.win11-toggle-row:last-child {
  @apply border-b-0;
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

.win11-session-card {
  @apply p-6 rounded-lg;
  @apply bg-win11-control-bg border border-win11-border;
}
</style>
