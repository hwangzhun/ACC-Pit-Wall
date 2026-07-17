<template>
  <div v-if="description" class="field-description">
    {{ description }}
  </div>
</template>

<script setup lang="ts">
import { useFieldDescription } from '../i18n'

const props = defineProps<{
  configName: 'settings' | 'configuration' | 'event' | 'eventRules' | 'assistRules' | 'entryList' | 'bop'
  fieldName: string
}>()

const description = useFieldDescription(props.configName, props.fieldName)
</script>

<style scoped>
.field-description {
  font-size: var(--type-caption);
  color: var(--win11-text-secondary);
  margin-top: 4px;
  line-height: 1.4;
}
</style>
