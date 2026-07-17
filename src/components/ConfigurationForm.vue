<template>
  <div class="configuration-form">
    <Win11Card>
      <template #title>
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-md bg-win11-accent/10 flex items-center justify-center">
            <svg class="w-5 h-5 text-win11-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0Z" />
            </svg>
          </div>
          <div>
            <h3 class="text-base font-semibold text-win11-text m-0">{{ t('nav.configuration') }}</h3>
            <p class="text-xs text-win11-text-secondary m-0">{{ t('networkPage.subtitle') }}</p>
          </div>
        </div>
      </template>

      <div class="network-summary summary-cards">
        <div><span>{{ t('networkPage.endpoint') }}</span><strong>TCP {{ configuration.tcpPort }} · UDP {{ configuration.udpPort }}</strong></div>
        <div><span>{{ t('networkPage.capacity') }}</span><strong>{{ configuration.maxConnections }}</strong></div>
        <div :class="{ active: configuration.registerToLobby === 1 }"><span>{{ t('networkPage.visibility') }}</span><strong>{{ lobbyStatus }}</strong></div>
      </div>
      <div v-if="portConflict" class="network-warning">{{ t('networkPage.portConflict') }}</div>
      <div class="win11-form-grid cols-2">
        <div class="space-y-4">
          <div class="win11-form-field">
            <label class="win11-form-label">{{ t('form.udpPort') }}</label>
            <Win11Input
              v-model.number="configuration.udpPort"
              type="number"
              :hint="t('networkPage.udpHint')"
            />
          </div>

          <div class="win11-form-field">
            <label class="win11-form-label">{{ t('form.tcpPort') }}</label>
            <Win11Input
              v-model.number="configuration.tcpPort"
              type="number"
              :hint="t('networkPage.tcpHint')"
            />
          </div>
        </div>

        <div class="space-y-4">
          <div class="win11-form-field">
            <label class="win11-form-label">{{ t('form.maxConnections') }}</label>
            <Win11Input
              v-model.number="configuration.maxConnections"
              type="number"
              :hint="t('networkPage.connectionsHint')"
            />
          </div>

          <div class="space-y-3">
            <div class="win11-toggle-row">
              <div class="win11-toggle-info">
                <span class="win11-toggle-label">{{ t('form.lanDiscovery') }}</span>
                <span class="win11-toggle-desc">{{ t('networkPage.lanDescription') }}</span>
              </div>
              <Win11Toggle
                :model-value="configuration.lanDiscovery === 1"
                @update:model-value="configuration.lanDiscovery = toFlag($event)"
              />
            </div>

            <div class="win11-toggle-row">
              <div class="win11-toggle-info">
                <span class="win11-toggle-label">{{ t('form.registerToLobby') }}</span>
                <span class="win11-toggle-desc">{{ t('networkPage.lobbyDescription') }}</span>
              </div>
              <Win11Toggle
                :model-value="configuration.registerToLobby === 1"
                @update:model-value="configuration.registerToLobby = toFlag($event)"
              />
            </div>
          </div>
        </div>
      </div>
    </Win11Card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Configuration } from '../types/configuration'
import { t } from '../i18n'
import { Win11Card, Win11Input, Win11Toggle } from './win11'

const props = defineProps<{
  configuration: Configuration
}>()

const portConflict = computed(() => props.configuration.tcpPort === props.configuration.udpPort)
const lobbyStatus = computed(() => props.configuration.registerToLobby === 1 ? t('networkPage.publicLobby') : t('networkPage.privateServer'))
function toFlag(value: boolean | number): number { return value === true || value === 1 ? 1 : 0 }
</script>

<style scoped>
.network-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-bottom:14px}.network-summary>div{padding:11px 13px;border:1px solid var(--win11-border);border-radius:9px;background:var(--win11-control-bg)}.network-summary span{display:block;font-size: var(--type-caption);color:var(--win11-text-secondary)}.network-summary strong{display:block;margin-top:3px;font-size: var(--type-body);color:var(--win11-text)}.network-summary .active{border-color:color-mix(in srgb,#258c5b 35%,var(--win11-border))}.network-summary .active strong{color:#258c5b}.network-warning{margin-bottom:13px;padding:10px 12px;border-radius:8px;background:color-mix(in srgb,#d85b3f 12%,var(--win11-control-bg));color:#d85b3f;font-size: var(--type-caption)}@media(max-width:620px){.network-summary{grid-template-columns:1fr}}
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
