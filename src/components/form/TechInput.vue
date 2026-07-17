<template>
  <div class="tech-form-field">
    <label v-if="label" :for="inputId" class="tech-label">
      {{ label }}
    </label>
    <div class="tech-input-wrapper">
      <input
        :id="inputId"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :min="min"
        :max="max"
        :step="step"
        class="tech-input-field"
        :class="{ 'has-error': error }"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        @focus="isFocused = true"
        @blur="isFocused = false"
      />
      <div v-if="suffix" class="tech-input-suffix">{{ suffix }}</div>
    </div>
    <p v-if="error" class="tech-error">{{ error }}</p>
    <p v-else-if="hint" class="tech-hint">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  modelValue: string | number
  label?: string
  type?: string
  placeholder?: string
  disabled?: boolean
  error?: string
  hint?: string
  suffix?: string
  min?: number
  max?: number
  step?: number
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()

const inputId = `input-${Math.random().toString(36).substr(2, 9)}`
const isFocused = ref(false)
</script>

<style scoped>
.tech-form-field {
  @apply space-y-2;
}

.tech-label {
  @apply block text-sm font-medium;
  color: var(--win11-text-secondary);
  @apply select-none;
}

.tech-input-wrapper {
  @apply relative flex items-center;
}

.tech-input-field {
  width: 100%;
  padding: 0.625rem 0.75rem;
  font-size: var(--type-body);
  background: var(--win11-surface);
  border: 2px solid var(--win11-border);
  border-radius: 0.5rem;
  color: var(--win11-text);
  @apply transition-all duration-200;
  @apply focus:outline-none focus:border-win11-accent focus:ring-2 focus:ring-win11-accent/20;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
}

.tech-input-field::placeholder {
  color: var(--win11-text-secondary);
  opacity: 0.5;
}

.tech-input-field.has-error {
  border-color: #f56c6c;
}

.tech-input-field.has-error:focus {
  border-color: #f56c6c;
  --tw-ring-color: rgba(245, 108, 108, 0.2);
}

.tech-input-field::-webkit-inner-spin-button,
.tech-input-field::-webkit-outer-spin-button {
  opacity: 0;
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 20px;
  margin: 0;
  cursor: pointer;
}

.tech-input-suffix {
  position: absolute;
  right: 1rem;
  color: var(--win11-text-secondary);
  font-size: var(--type-body);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace;
  @apply pointer-events-none;
}

.tech-error {
  @apply text-xs;
  color: #f56c6c;
}

.tech-hint {
  @apply text-xs;
  color: var(--win11-text-secondary);
  opacity: 0.7;
}
</style>
