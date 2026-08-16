<template>
  <Win11Dialog v-model="visible" :title="t('preset.saveAsDialogTitle')" width="min(520px, calc(100vw - 32px))" :z-index="3200">
    <div class="save-context">
      <div><span>{{ t('form.track') }}</span><strong>{{ trackDisplay }}</strong></div>
      <div><span>{{ t('form.carGroup') }}</span><strong>{{ configs.settings.carGroup || t('preset.unset') }}</strong></div>
    </div>
    <div class="save-form">
      <label class="win11-form-label required">{{ t('preset.presetName') }}</label>
      <Win11Input v-model="name" :placeholder="t('preset.placeholderName')" :error="nameError" />
      <label class="win11-form-label">{{ t('preset.description') }}</label>
      <textarea v-model="description" class="win11-textarea" :rows="3" :placeholder="t('preset.placeholderDescription')"></textarea>
    </div>
    <template #footer>
      <Win11Button variant="secondary" :disabled="busy" @click="close">{{ t('common.cancel') }}</Win11Button>
      <Win11Button variant="primary" :loading="busy" @click="submit">{{ t('preset.saveAs') }}</Win11Button>
    </template>
  </Win11Dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { AllConfigs } from '../../types/configuration'
import { formatTrackName } from '../../types/defaults'
import { getCurrentLanguage, t, currentLanguage } from '../../i18n'
import { Win11Button, Win11Dialog, Win11Input } from '../win11'

const props = defineProps<{ modelValue: boolean; configs: AllConfigs; busy: boolean }>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  save: [payload: { name: string; description: string }]
}>()

const visible = computed({ get: () => props.modelValue, set: value => emit('update:modelValue', value) })
const name = ref('')
const description = ref('')
const nameError = ref('')
const trackDisplay = computed(() => {
  void currentLanguage.value
  return props.configs.event.track ? formatTrackName(props.configs.event.track, getCurrentLanguage()) : t('preset.unset')
})

watch(() => props.modelValue, open => {
  if (open) {
    name.value = ''
    description.value = ''
    nameError.value = ''
  }
})

function close() { visible.value = false }
function submit() {
  if (!name.value.trim()) {
    nameError.value = t('preset.warnNameRequired')
    return
  }
  nameError.value = ''
  emit('save', { name: name.value.trim(), description: description.value.trim() })
}
</script>

<style scoped>
.save-context{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:18px}.save-context>div{padding:10px 12px;border:1px solid var(--win11-border);border-radius:8px;background:var(--win11-control-bg);min-width:0}.save-context span{display:block;font-size:var(--type-caption);color:var(--win11-text-secondary)}.save-context strong{display:block;margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--win11-text)}.save-form{display:flex;flex-direction:column;gap:8px}.win11-form-label{margin-top:8px;font-size:var(--type-body);font-weight:var(--weight-emphasis);color:var(--win11-text)}.win11-form-label.required::after{content:' *';color:#d13438}.win11-textarea{width:100%;padding:10px 12px;font-size:var(--type-body);color:var(--win11-text);background:var(--win11-control-bg);border:1px solid var(--win11-border);border-radius:6px;resize:vertical;outline:none}.win11-textarea:focus{border-color:var(--win11-accent)}
</style>
