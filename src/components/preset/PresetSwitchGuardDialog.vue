<template>
  <Win11Dialog
    v-model="visible"
    :title="t('preset.unsavedTitle')"
    width="min(540px, calc(100vw - 32px))"
    :z-index="3100"
    :close-on-click-modal="false"
  >
    <div class="guard-message">
      <span class="guard-icon">!</span>
      <div>
        <strong>{{ t('preset.unsavedHeading') }}</strong>
        <p>{{ t('preset.unsavedMessage').replace('{target}', targetName) }}</p>
      </div>
    </div>
    <template #footer>
      <Win11Button variant="secondary" :disabled="busy" @click="$emit('cancel')">{{ t('common.cancel') }}</Win11Button>
      <Win11Button variant="danger" :disabled="busy" @click="$emit('discard-switch')">{{ t('preset.discardAndSwitch') }}</Win11Button>
      <Win11Button variant="primary" :loading="busy" @click="$emit('save-switch')">
        {{ hasActivePreset ? t('preset.saveAndSwitch') : t('preset.saveAsAndSwitch') }}
      </Win11Button>
    </template>
  </Win11Dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { t } from '../../i18n'
import { Win11Button, Win11Dialog } from '../win11'

const props = defineProps<{
  modelValue: boolean
  hasActivePreset: boolean
  targetName: string
  busy: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'save-switch': []
  'discard-switch': []
  cancel: []
}>()

const visible = computed({ get: () => props.modelValue, set: value => emit('update:modelValue', value) })
</script>

<style scoped>
.guard-message{display:flex;align-items:flex-start;gap:14px}.guard-icon{display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;flex-shrink:0;background:rgba(201,133,27,.14);color:#c9851b;font-size:20px;font-weight:700}.guard-message strong{color:var(--win11-text)}.guard-message p{margin:6px 0 0;line-height:1.55;color:var(--win11-text-secondary)}
</style>
