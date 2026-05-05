<template>
  <div class="settings-form">
    <Win11Card>
      <template #title>
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-md bg-win11-accent/10 flex items-center justify-center">
            <svg class="w-5 h-5 text-win11-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
            </svg>
          </div>
          <div>
            <h3 class="text-base font-semibold text-win11-text m-0">{{ t('nav.settings') }}</h3>
            <p class="text-xs text-win11-text-secondary m-0">{{ t('form.serverConfiguration') }}</p>
          </div>
        </div>
      </template>

      <div class="win11-form-grid cols-2">
        <div class="win11-form-field">
          <label class="win11-form-label">{{ t('form.serverName') }}</label>
          <Win11Input
            v-model="settings.serverName"
            :placeholder="t('placeholder.pleaseInput')"
            :hint="serverNameHint"
          />
        </div>

        <div class="win11-form-field">
          <label class="win11-form-label">{{ t('form.password') }}</label>
          <Win11Input
            v-model="settings.password"
            type="password"
            show-password-toggle
            :placeholder="t('common.optional')"
            :hint="passwordHint"
          />
        </div>

        <div class="win11-form-field">
          <label class="win11-form-label">{{ t('form.adminPassword') }}</label>
          <Win11Input
            v-model="settings.adminPassword"
            type="password"
            show-password-toggle
            :placeholder="t('common.optional')"
            :hint="adminPasswordHint"
          />
        </div>

        <div class="win11-form-field">
          <label class="win11-form-label">{{ t('form.spectatorPassword') }}</label>
          <Win11Input
            v-model="settings.spectatorPassword"
            type="password"
            show-password-toggle
            :placeholder="t('common.optional')"
            :hint="spectatorPasswordHint"
          />
        </div>

        <div class="win11-form-field">
          <label class="win11-form-label">{{ t('form.carGroup') }}</label>
          <Win11Select
            v-model="settings.carGroup"
            :options="carGroupOptions"
            :hint="carGroupHint"
          />
        </div>

        <div class="win11-form-field">
          <label class="win11-form-label">{{ t('form.maxCarSlots') }}</label>
          <Win11Input
            v-model.number="settings.maxCarSlots"
            type="number"
            :hint="maxCarSlotsHint"
          />
        </div>
      </div>
    </Win11Card>

    <Win11Card>
      <template #title>
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-md bg-win11-accent/10 flex items-center justify-center">
            <svg class="w-5 h-5 text-win11-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <div>
            <h3 class="text-base font-semibold text-win11-text m-0">{{ t('form.ratingRequirements') }}</h3>
            <p class="text-xs text-win11-text-secondary m-0">{{ t('form.driverQualification') }}</p>
          </div>
        </div>
      </template>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="win11-form-field">
          <label class="win11-form-label">{{ t('form.trackMedalsRequirement') }}</label>
          <Win11Select
            v-model.number="settings.trackMedalsRequirement"
            :options="medalOptions"
            :hint="trackMedalsHint"
          />
        </div>

        <div class="win11-form-field">
          <label class="win11-form-label">{{ t('form.safetyRatingRequirement') }}</label>
          <Win11Input
            v-model.number="settings.safetyRatingRequirement"
            type="number"
            :hint="safetyRatingHint"
          />
        </div>

        <div class="win11-form-field">
          <label class="win11-form-label">{{ t('form.racecraftRatingRequirement') }}</label>
          <Win11Input
            v-model.number="settings.racecraftRatingRequirement"
            type="number"
            :hint="racecraftRatingHint"
          />
        </div>
      </div>
    </Win11Card>

    <Win11Card>
      <template #title>
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-md bg-win11-accent/10 flex items-center justify-center">
            <svg class="w-5 h-5 text-win11-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </div>
          <div>
            <h3 class="text-base font-semibold text-win11-text m-0">{{ t('form.raceOptions') }}</h3>
            <p class="text-xs text-win11-text-secondary m-0">{{ t('form.raceBehavior') }}</p>
          </div>
        </div>
      </template>

      <div class="space-y-2">
        <div
          v-for="(enabled, key) in toggleOptions"
          :key="key"
          class="win11-toggle-row"
        >
          <div class="win11-toggle-info">
            <span class="win11-toggle-label">{{ getToggleLabel(key) }}</span>
            <span class="win11-toggle-desc">{{ getToggleDescription(key) }}</span>
          </div>
          <Win11Toggle
            :model-value="enabled ? 1 : 0"
            @update:model-value="updateToggle(key, $event)"
          />
        </div>
      </div>
    </Win11Card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Settings } from '../types/configuration'
import { CAR_GROUPS } from '../types/defaults'
import { t, useFieldDescription, getFieldDescription } from '../i18n'
import { Win11Card, Win11Input, Win11Select, Win11Toggle } from './win11'

const props = defineProps<{
  settings: Settings
}>()

const serverNameHint = useFieldDescription('settings', 'serverName')
const passwordHint = useFieldDescription('settings', 'password')
const adminPasswordHint = useFieldDescription('settings', 'adminPassword')
const spectatorPasswordHint = useFieldDescription('settings', 'spectatorPassword')
const carGroupHint = useFieldDescription('settings', 'carGroup')
const maxCarSlotsHint = useFieldDescription('settings', 'maxCarSlots')

const trackMedalsHint = useFieldDescription('settings', 'trackMedalsRequirement')
const safetyRatingHint = useFieldDescription('settings', 'safetyRatingRequirement')
const racecraftRatingHint = useFieldDescription('settings', 'racecraftRatingRequirement')

const carGroupOptions = computed(() =>
  CAR_GROUPS.map(group => ({ label: group, value: group }))
)

const medalOptions = computed(() => [
  { label: t('common.none'), value: 0 },
  { label: `1 ${t('common.medal')}`, value: 1 },
  { label: `2 ${t('common.medals')}`, value: 2 },
  { label: `3 ${t('common.medals')}`, value: 3 }
])

const toggleOptions = computed(() => ({
  isRaceLocked: props.settings.isRaceLocked === 1,
  isLockedPrepPhase: props.settings.isLockedPrepPhase === 1,
  shortFormationLap: props.settings.shortFormationLap === 1,
  allowAutoDQ: props.settings.allowAutoDQ === 1,
  ignorePrematureDisconnects: props.settings.ignorePrematureDisconnects === 1,
  randomizeTrackWhenEmpty: props.settings.randomizeTrackWhenEmpty === 1,
  dumpLeaderboards: props.settings.dumpLeaderboards === 1,
  dumpEntryList: props.settings.dumpEntryList === 1,
}))

function getToggleLabel(key: string): string {
  return t(`form.${key}`) || key
}

function getToggleDescription(key: string): string {
  return getFieldDescription('settings', key)
}

type ToggleKey = 'isRaceLocked' | 'isLockedPrepPhase' | 'shortFormationLap' | 'allowAutoDQ' | 'ignorePrematureDisconnects' | 'randomizeTrackWhenEmpty' | 'dumpLeaderboards' | 'dumpEntryList'

function updateToggle(key: string, value: number) {
  const toggleKey = key as ToggleKey
  props.settings[toggleKey] = value as Settings[ToggleKey]
}
</script>

<style scoped>
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
</style>
