<template>
  <div class="event-rules-form">
    <Win11Card>
      <template #title>
        <div class="flex items-center gap-3">
          <div class="rule-icon">⚑</div>
          <div><h3>{{ t('nav.eventRules') }}</h3><p>{{ t('eventRulesPage.subtitle') }}</p></div>
        </div>
      </template>

      <div class="rules-content">
        <div class="event-rules-summary summary-cards">
          <div v-for="(value, index) in summary" :key="index">
            <span>{{ summaryLabels[index] }}</span>
            <strong>{{ value }}</strong>
          </div>
        </div>

        <div class="section-grid">
          <section class="section">
            <header><h4>{{ t('eventRulesPage.qualifyingGroup') }}</h4><p>{{ t('eventRulesPage.qualifyingGroupDescription') }}</p></header>
            <div class="field">
              <label>{{ t('eventRulesPage.qualifyingStanding') }}</label>
              <Win11Select :model-value="eventRules.qualifyStandingType" :options="qualifyingOptions" @update:model-value="eventRules.qualifyStandingType = Number($event)" />
              <small>{{ t('eventRulesPage.qualifyingStandingHint') }}</small>
            </div>
          </section>

          <section class="section">
            <header><h4>{{ t('eventRulesPage.pitGroup') }}</h4><p>{{ t('eventRulesPage.pitGroupDescription') }}</p></header>
            <div class="fields">
              <div class="field">
                <label>{{ t('eventRulesPage.mandatoryStops') }}</label>
                <Win11Input :model-value="eventRules.mandatoryPitstopCount" type="number" :hint="stopsHint" @update:model-value="setStops" />
              </div>
              <div class="field">
                <label>{{ t('eventRulesPage.pitWindowMinutes') }}</label>
                <Win11Input :model-value="pitWindowMinutes" type="number" :hint="pitWindowHint" @update:model-value="setPitWindow" />
                <button class="quick-button" :class="{ active: eventRules.pitWindowLengthSec < 0 }" @click="eventRules.pitWindowLengthSec = -1">{{ t('eventRulesPage.unlimited') }}</button>
              </div>
            </div>
          </section>

          <section class="section">
            <header><h4>{{ t('eventRulesPage.driverGroup') }}</h4><p>{{ t('eventRulesPage.driverGroupDescription') }}</p></header>
            <div class="fields">
              <div class="field"><label>{{ t('eventRulesPage.maxDrivers') }}</label><Win11Input :model-value="eventRules.maxDriversCount" type="number" :hint="t('eventRulesPage.maxDriversHint')" @update:model-value="setDrivers" /></div>
              <div class="field"><label>{{ t('eventRulesPage.stintMinutes') }}</label><Win11Input :model-value="stintMinutes" type="number" :hint="durationHint(eventRules.driverStintTimeSec)" @update:model-value="eventRules.driverStintTimeSec = toSeconds($event, eventRules.driverStintTimeSec)" /></div>
              <div class="field"><label>{{ t('eventRulesPage.totalDrivingMinutes') }}</label><Win11Input :model-value="totalMinutes" type="number" :hint="durationHint(eventRules.maxTotalDrivingTime)" @update:model-value="eventRules.maxTotalDrivingTime = toSeconds($event, eventRules.maxTotalDrivingTime)" /></div>
              <div class="field"><label>{{ t('eventRulesPage.tyreSets') }}</label><Win11Input :model-value="eventRules.tyreSetCount" type="number" :hint="t('eventRulesPage.tyreSetsHint')" @update:model-value="eventRules.tyreSetCount = integer($event, eventRules.tyreSetCount)" /></div>
            </div>
          </section>

          <section class="section requirements">
            <header>
              <div><h4>{{ t('eventRulesPage.requirementsGroup') }}</h4><p>{{ t('eventRulesPage.requirementsGroupDescription') }}</p></div>
              <span class="badge" :class="{ on: hasStops }">{{ hasStops ? t('eventRulesPage.active') : t('eventRulesPage.inactive') }}</span>
            </header>
            <div class="toggles">
              <RuleToggle :label="t('form.isRefuellingAllowedInRace')" :description="t('eventRulesPage.refuellingAllowedDescription')" :value="eventRules.isRefuellingAllowedInRace" @change="setRefuelling" />
              <RuleToggle :label="t('form.isRefuellingTimeFixed')" :description="eventRules.isRefuellingAllowedInRace ? t('eventRulesPage.fixedRefuellingDescription') : t('eventRulesPage.requiresRefuelling')" :value="eventRules.isRefuellingTimeFixed" :disabled="!eventRules.isRefuellingAllowedInRace" @change="eventRules.isRefuellingTimeFixed = $event" />
              <RuleToggle :label="t('form.isMandatoryPitstopRefuellingRequired')" :description="canRefuel ? t('eventRulesPage.mandatoryRefuellingDescription') : prerequisiteText" :value="eventRules.isMandatoryPitstopRefuellingRequired" :disabled="!canRefuel" @change="eventRules.isMandatoryPitstopRefuellingRequired = $event" />
              <RuleToggle :label="t('form.isMandatoryPitstopTyreChangeRequired')" :description="hasStops ? t('eventRulesPage.mandatoryTyreDescription') : prerequisiteText" :value="eventRules.isMandatoryPitstopTyreChangeRequired" :disabled="!hasStops" @change="eventRules.isMandatoryPitstopTyreChangeRequired = $event" />
              <RuleToggle :label="t('form.isMandatoryPitstopSwapDriverRequired')" :description="swapDescription" :value="eventRules.isMandatoryPitstopSwapDriverRequired" :disabled="!canSwap" @change="eventRules.isMandatoryPitstopSwapDriverRequired = $event" />
            </div>
          </section>
        </div>

        <div class="note">{{ t('eventRulesPage.unitNote') }}</div>
      </div>
    </Win11Card>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h } from 'vue'
import type { EventRules } from '../types/configuration'
import { t } from '../i18n'
import { Win11Card, Win11Input, Win11Toggle, Win11Select } from './win11'

const props = defineProps<{ eventRules: EventRules }>()
const RuleToggle = defineComponent({
  props: { label: String, description: String, value: Boolean, disabled: Boolean },
  emits: ['change'],
  setup(p, { emit }) {
    return () => h('article', { class: ['toggle-card', { muted: p.disabled }] }, [
      h('div', [h('strong', p.label), h('p', p.description)]),
      h(Win11Toggle, { modelValue: p.value, disabled: p.disabled, 'onUpdate:modelValue': (v: boolean | number) => emit('change', v === true || v === 1) })
    ])
  }
})

const qualifyingOptions = computed(() => [
  { value: 0, label: t('eventRulesPage.fastestLap') },
  { value: 1, label: t('eventRulesPage.lastQualifyingResult') }
])
const hasStops = computed(() => props.eventRules.mandatoryPitstopCount > 0)
const canRefuel = computed(() => hasStops.value && props.eventRules.isRefuellingAllowedInRace)
const canSwap = computed(() => hasStops.value && props.eventRules.maxDriversCount > 1)
const pitWindowMinutes = computed(() => props.eventRules.pitWindowLengthSec < 0 ? '' : minutes(props.eventRules.pitWindowLengthSec))
const stintMinutes = computed(() => minutes(props.eventRules.driverStintTimeSec))
const totalMinutes = computed(() => minutes(props.eventRules.maxTotalDrivingTime))
const stopsHint = computed(() => t(hasStops.value ? 'eventRulesPage.mandatoryStopsEnabled' : 'eventRulesPage.mandatoryStopsDisabled'))
const pitWindowHint = computed(() => props.eventRules.pitWindowLengthSec < 0 ? t('eventRulesPage.unlimitedHint') : durationHint(props.eventRules.pitWindowLengthSec))
const prerequisiteText = computed(() => t('eventRulesPage.requiresMandatoryStop'))
const swapDescription = computed(() => !hasStops.value ? prerequisiteText.value : props.eventRules.maxDriversCount <= 1 ? t('eventRulesPage.requiresMultipleDrivers') : t('eventRulesPage.mandatoryDriverSwapDescription'))
const summaryLabels = computed(() => [
  t('eventRulesPage.mandatoryStops'),
  t('eventRulesPage.pitWindowMinutes'),
  t('eventRulesPage.maxDrivers'),
  t('eventRulesPage.tyreSets'),
  t('form.isRefuellingAllowedInRace')
])
const summary = computed(() => [
  hasStops.value ? t('eventRulesPage.summaryStops').replace('{count}', String(props.eventRules.mandatoryPitstopCount)) : t('eventRulesPage.summaryNoStops'),
  props.eventRules.pitWindowLengthSec < 0 ? t('eventRulesPage.summaryUnlimitedWindow') : t('eventRulesPage.summaryWindow').replace('{minutes}', String(minutes(props.eventRules.pitWindowLengthSec))),
  t('eventRulesPage.summaryDrivers').replace('{count}', String(props.eventRules.maxDriversCount)),
  props.eventRules.isMandatoryPitstopTyreChangeRequired && hasStops.value ? t('eventRulesPage.summaryTyreRequired') : t('eventRulesPage.summaryTyreOptional'),
  props.eventRules.isRefuellingAllowedInRace ? t('eventRulesPage.summaryRefuellingAllowed') : t('eventRulesPage.summaryRefuellingDisabled')
])

function numberValue(value: string | number, fallback: number) { const n = Number(value); return Number.isFinite(n) ? n : fallback }
function integer(value: string | number, fallback: number) { return Math.max(0, Math.round(numberValue(value, fallback))) }
function minutes(seconds: number) { return Math.round(seconds / 6) / 10 }
function toSeconds(value: string | number, fallback: number) { return Math.max(0, Math.round(numberValue(value, fallback / 60) * 60)) }
function durationHint(seconds: number) {
  if (seconds === 0) return t('eventRulesPage.unlimitedHint')
  const mins = Math.round(seconds / 60), hours = Math.floor(mins / 60), rest = mins % 60
  if (!hours) return t('eventRulesPage.minutesValue').replace('{minutes}', String(mins))
  return rest ? t('eventRulesPage.hoursMinutesValue').replace('{hours}', String(hours)).replace('{minutes}', String(rest)) : t('eventRulesPage.hoursValue').replace('{hours}', String(hours))
}
function setPitWindow(value: string) { if (value !== '') props.eventRules.pitWindowLengthSec = toSeconds(value, Math.max(0, props.eventRules.pitWindowLengthSec)) }
function setStops(value: string) {
  props.eventRules.mandatoryPitstopCount = integer(value, props.eventRules.mandatoryPitstopCount)
  if (!hasStops.value) {
    props.eventRules.isMandatoryPitstopRefuellingRequired = false
    props.eventRules.isMandatoryPitstopTyreChangeRequired = false
    props.eventRules.isMandatoryPitstopSwapDriverRequired = false
  }
}
function setDrivers(value: string) {
  props.eventRules.maxDriversCount = Math.max(1, integer(value, props.eventRules.maxDriversCount))
  if (props.eventRules.maxDriversCount === 1) props.eventRules.isMandatoryPitstopSwapDriverRequired = false
}
function setRefuelling(value: boolean) {
  props.eventRules.isRefuellingAllowedInRace = value
  if (!value) {
    props.eventRules.isRefuellingTimeFixed = false
    props.eventRules.isMandatoryPitstopRefuellingRequired = false
  }
}
</script>

<style scoped>
.rule-icon{width:32px;height:32px;display:grid;place-items:center;border-radius:7px;background:color-mix(in srgb,var(--win11-accent) 12%,transparent);color:var(--win11-accent)}h3{margin:0;font-size: var(--type-section);color:var(--win11-text)}.flex p{margin:0;font-size: var(--type-caption);color:var(--win11-text-secondary)}.rules-content{display:flex;flex-direction:column;gap:16px}.summary,.note{padding:12px 14px;border-radius:9px;background:color-mix(in srgb,var(--win11-accent) 7%,var(--win11-control-bg));font-size: var(--type-caption);line-height:1.5;color:var(--win11-text)}.summary{border:1px solid color-mix(in srgb,var(--win11-accent) 28%,var(--win11-border));font-weight: var(--weight-emphasis)}.note{color:var(--win11-text-secondary)}.section-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.section{padding:15px;border:1px solid var(--win11-border);border-radius:11px;background:var(--win11-surface)}.requirements{grid-column:1/-1}.section header{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:13px}.section h4{margin:0 0 4px;font-size: var(--type-body);color:var(--win11-text)}.section header p{margin:0;font-size: var(--type-caption);color:var(--win11-text-secondary)}.fields,.toggles{display:grid;grid-template-columns:1fr 1fr;gap:10px}.field{display:flex;flex-direction:column;gap:6px}.field label{font-size: var(--type-caption);font-weight: var(--weight-emphasis);color:var(--win11-text)}.field small{font-size: var(--type-caption);color:var(--win11-text-secondary)}.quick-button{align-self:flex-start;padding:3px 8px;border:1px solid var(--win11-border);border-radius:6px;background:var(--win11-control-bg);color:var(--win11-text-secondary);font-size: var(--type-caption)}.quick-button.active{border-color:var(--win11-accent);color:var(--win11-accent)}.toggle-card{min-height:70px;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 12px;border:1px solid color-mix(in srgb,#258c5b 25%,var(--win11-border));border-radius:9px;background:var(--win11-control-bg)}.toggle-card strong{font-size: var(--type-caption);color:var(--win11-text)}.toggle-card p{margin:4px 0 0;font-size: var(--type-caption);line-height:1.4;color:var(--win11-text-secondary)}.toggle-card.muted{border-color:var(--win11-border);opacity:.65}.badge{padding:4px 9px;border-radius:999px;background:rgba(216,91,63,.12);color:#d85b3f;font-size: var(--type-caption);font-weight: var(--weight-emphasis)}.badge.on{background:rgba(37,140,91,.12);color:#258c5b}@media(max-width:900px){.section-grid{grid-template-columns:1fr}.requirements{grid-column:auto}}@media(max-width:620px){.fields,.toggles{grid-template-columns:1fr}}
</style>
