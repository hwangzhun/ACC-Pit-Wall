<template>
  <div class="assist-rules-form">
    <Win11Card>
      <template #title>
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-md bg-win11-accent/10 flex items-center justify-center">
            <svg class="w-5 h-5 text-win11-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h3 class="text-base font-semibold text-win11-text m-0">{{ t('nav.assistRules') }}</h3>
            <p class="text-xs text-win11-text-secondary m-0">{{ t('assistPage.subtitle') }}</p>
          </div>
        </div>
      </template>

      <div class="assist-content">
        <section class="summary-grid summary-cards">
          <article><span>{{ t('assistPage.allowedCount') }}</span><strong>{{ allowedCount }}</strong><small>/ {{ assistItems.length }}</small></article>
          <article :class="{ warning: disabledCount > 0 }"><span>{{ t('assistPage.disabledCount') }}</span><strong>{{ disabledCount }}</strong><small>/ {{ assistItems.length }}</small></article>
          <article class="stability-summary"><span>{{ t('form.stabilityControlLevelMax') }}</span><strong>{{ assistRules.stabilityControlLevelMax }}%</strong><small>{{ stabilityStatus }}</small></article>
        </section>

        <section class="stability-card">
          <div class="section-heading">
            <div><h4>{{ t('assistPage.stabilityTitle') }}</h4><p>{{ t('assistPage.stabilityDescription') }}</p></div>
            <span class="level-badge">{{ assistRules.stabilityControlLevelMax }}%</span>
          </div>
          <Win11Slider v-model="assistRules.stabilityControlLevelMax" :min="0" :max="100" :step="1" />
          <div class="stability-scale"><span>0%</span><span>50%</span><span>100%</span></div>
          <div class="quick-actions">
            <Win11Button size="small" variant="secondary" @click="setStability(0)">{{ t('assistPage.stabilityOff') }}</Win11Button>
            <Win11Button size="small" variant="secondary" @click="setStability(50)">50%</Win11Button>
            <Win11Button size="small" variant="secondary" @click="setStability(100)">{{ t('assistPage.stabilityUnlimited') }}</Win11Button>
          </div>
        </section>

        <div class="assist-groups">
          <section v-for="group in assistGroups" :key="group.title" class="assist-group">
            <div class="section-heading compact"><div><h4>{{ group.title }}</h4><p>{{ group.description }}</p></div></div>
            <div class="assist-grid">
              <article v-for="item in group.items" :key="item.key" class="assist-card" :class="{ disabled: !isAllowed(item.key) }">
                <div class="assist-info">
                  <div class="assist-title-row">
                    <span class="status-dot" :class="{ allowed: isAllowed(item.key) }"></span>
                    <strong>{{ item.label }}</strong>
                  </div>
                  <p>{{ item.description }}</p>
                  <span class="status-text" :class="{ allowed: isAllowed(item.key) }">
                    {{ isAllowed(item.key) ? t('assistPage.allowed') : t('assistPage.disabled') }}
                  </span>
                </div>
                <Win11Toggle :model-value="isAllowed(item.key)" @update:model-value="setAllowed(item.key, $event)" />
              </article>
            </div>
          </section>
        </div>

        <div class="meaning-note">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span>{{ t('assistPage.ruleMeaning') }}</span>
        </div>
      </div>
    </Win11Card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { AssistRules } from '../types/configuration'
import { t } from '../i18n'
import { Win11Card, Win11Slider, Win11Toggle, Win11Button } from './win11'

type AssistKey = Exclude<keyof AssistRules, 'stabilityControlLevelMax'>
interface AssistItem { key: AssistKey; label: string; description: string }
const props = defineProps<{ assistRules: AssistRules }>()

const drivingItems = computed<AssistItem[]>(() => [
  { key: 'disableIdealLine', label: t('assistPage.allowIdealLine'), description: t('assistPage.idealLineDescription') },
  { key: 'disableAutosteer', label: t('assistPage.allowAutosteer'), description: t('assistPage.autosteerDescription') },
  { key: 'disableAutoGear', label: t('assistPage.allowAutoGear'), description: t('assistPage.autoGearDescription') },
  { key: 'disableAutoClutch', label: t('assistPage.allowAutoClutch'), description: t('assistPage.autoClutchDescription') }
])
const automationItems = computed<AssistItem[]>(() => [
  { key: 'disableAutoPitLimiter', label: t('assistPage.allowAutoPitLimiter'), description: t('assistPage.autoPitLimiterDescription') },
  { key: 'disableAutoEngineStart', label: t('assistPage.allowAutoEngineStart'), description: t('assistPage.autoEngineStartDescription') },
  { key: 'disableAutoWiper', label: t('assistPage.allowAutoWiper'), description: t('assistPage.autoWiperDescription') },
  { key: 'disableAutoLights', label: t('assistPage.allowAutoLights'), description: t('assistPage.autoLightsDescription') }
])
const assistItems = computed(() => [...drivingItems.value, ...automationItems.value])
const assistGroups = computed(() => [
  { title: t('assistPage.drivingGroup'), description: t('assistPage.drivingGroupDescription'), items: drivingItems.value },
  { title: t('assistPage.automationGroup'), description: t('assistPage.automationGroupDescription'), items: automationItems.value }
])
const allowedCount = computed(() => assistItems.value.filter(item => isAllowed(item.key)).length)
const disabledCount = computed(() => assistItems.value.length - allowedCount.value)
const stabilityStatus = computed(() => props.assistRules.stabilityControlLevelMax === 0 ? t('assistPage.stabilityOff') : props.assistRules.stabilityControlLevelMax === 100 ? t('assistPage.stabilityUnlimited') : t('assistPage.stabilityLimited'))

function isAllowed(key: AssistKey): boolean { return Number(props.assistRules[key]) === 0 }
function setAllowed(key: AssistKey, allowed: boolean | number) {
  const normalizedAllowed = allowed === true || allowed === 1
  props.assistRules[key] = normalizedAllowed ? 0 : 1
}
function setStability(value: number) { props.assistRules.stabilityControlLevelMax = value }
</script>

<style scoped>
.assist-content{display:flex;flex-direction:column;gap:18px}.summary-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.summary-grid article{display:grid;grid-template-columns:1fr auto;align-items:end;gap:3px 8px;padding:13px 15px;border:1px solid var(--win11-border);border-radius:10px;background:var(--win11-control-bg)}.summary-grid span{grid-column:1/-1;font-size: var(--type-caption);color:var(--win11-text-secondary)}.summary-grid strong{font-size: var(--type-metric);line-height:1;color:#258c5b}.summary-grid small{font-size: var(--type-caption);color:var(--win11-text-secondary)}.summary-grid .warning strong{color:#d85b3f}.summary-grid .stability-summary strong{color:var(--win11-accent)}.stability-card,.assist-group{padding:15px;border:1px solid var(--win11-border);border-radius:11px;background:var(--win11-surface)}.section-heading{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px}.section-heading h4{margin:0 0 4px;font-size: var(--type-body);color:var(--win11-text)}.section-heading p{margin:0;font-size: var(--type-caption);line-height:1.5;color:var(--win11-text-secondary)}.section-heading.compact{margin-bottom:11px}.level-badge{padding:4px 9px;border-radius:999px;background:color-mix(in srgb,var(--win11-accent) 12%,transparent);color:var(--win11-accent);font-size: var(--type-caption);font-weight: var(--weight-emphasis)}.stability-scale{display:flex;justify-content:space-between;margin-top:3px;color:var(--win11-text-secondary);font-size: var(--type-caption)}.quick-actions{display:flex;gap:8px;margin-top:12px}.assist-groups{display:grid;grid-template-columns:1fr 1fr;gap:12px}.assist-grid{display:grid;gap:8px}.assist-card{display:flex;justify-content:space-between;align-items:center;gap:14px;min-height:78px;padding:11px 12px;border:1px solid color-mix(in srgb,#258c5b 28%,var(--win11-border));border-radius:9px;background:var(--win11-control-bg)}.assist-card.disabled{border-color:var(--win11-border);background:color-mix(in srgb,var(--win11-control-bg) 70%,transparent)}.assist-info{min-width:0}.assist-title-row{display:flex;align-items:center;gap:7px}.assist-title-row strong{font-size: var(--type-caption);color:var(--win11-text)}.status-dot{width:7px;height:7px;flex:none;border-radius:50%;background:#d85b3f}.status-dot.allowed{background:#258c5b;box-shadow:0 0 0 3px rgba(37,140,91,.12)}.assist-info p{margin:4px 0 5px;font-size: var(--type-caption);line-height:1.4;color:var(--win11-text-secondary)}.status-text{font-size: var(--type-caption);font-weight: var(--weight-emphasis);color:#d85b3f}.status-text.allowed{color:#258c5b}.meaning-note{display:flex;align-items:flex-start;gap:9px;padding:11px 13px;border-radius:9px;background:color-mix(in srgb,var(--win11-accent) 7%,var(--win11-control-bg));color:var(--win11-text-secondary);font-size: var(--type-caption);line-height:1.5}.meaning-note svg{width:16px;height:16px;flex:none;color:var(--win11-accent)}@media(max-width:900px){.assist-groups{grid-template-columns:1fr}}@media(max-width:620px){.summary-grid{grid-template-columns:1fr}.quick-actions{flex-wrap:wrap}}
</style>
