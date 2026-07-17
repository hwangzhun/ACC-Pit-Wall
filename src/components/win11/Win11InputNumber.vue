<template>
  <div class="win11-input-number" :class="{ disabled }">
    <button
      v-if="!controlsPosition || controlsPosition === 'right'"
      type="button"
      class="win11-input-number__btn win11-input-number__decrease"
      :disabled="disabled || modelValue <= min"
      @click="decrease"
    >
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
      </svg>
    </button>
    <input
      type="text"
      class="win11-input-number__input"
      :value="displayValue"
      :disabled="disabled"
      @input="handleInput"
      @blur="handleBlur"
    />
    <button
      v-if="!controlsPosition || controlsPosition === 'right'"
      type="button"
      class="win11-input-number__btn win11-input-number__increase"
      :disabled="disabled || modelValue >= max"
      @click="increase"
    >
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue?: number
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  controlsPosition?: 'right'
  size?: 'small' | 'default'
}>(), {
  modelValue: 0,
  min: -Infinity,
  max: Infinity,
  step: 1,
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
  'change': [value: number]
}>()

const displayValue = computed(() => String(props.modelValue))

function decrease() {
  const newValue = Math.max(props.min, props.modelValue - props.step)
  emit('update:modelValue', newValue)
  emit('change', newValue)
}

function increase() {
  const newValue = Math.min(props.max, props.modelValue + props.step)
  emit('update:modelValue', newValue)
  emit('change', newValue)
}

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement
  const value = parseFloat(target.value)
  if (!isNaN(value)) {
    const clamped = Math.max(props.min, Math.min(props.max, value))
    emit('update:modelValue', clamped)
  }
}

function handleBlur() {
  emit('change', props.modelValue)
}
</script>

<script lang="ts">
import { computed } from 'vue'
</script>

<style scoped>
.win11-input-number {
  display: inline-flex;
  align-items: stretch;
  width: 100%;
  max-width: 150px;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid var(--win11-border);
  background: var(--win11-control-bg);
  transition: all 0.15s;
}

.win11-input-number:focus-within {
  border-color: var(--win11-accent);
  box-shadow: 0 0 0 1px var(--win11-accent);
}

.win11-input-number.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.win11-input-number__input {
  flex: 1;
  min-width: 0;
  padding: 8px 4px;
  background: transparent;
  border: none;
  text-align: center;
  font-size: var(--type-body);
  color: var(--win11-text);
  outline: none;
}

.win11-input-number__input::-webkit-inner-spin-button,
.win11-input-number__input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.win11-input-number__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  padding: 0;
  background: transparent;
  border: none;
  color: var(--win11-text-secondary);
  cursor: pointer;
  transition: all 0.15s;
}

.win11-input-number__btn:hover:not(:disabled) {
  background: var(--win11-control-hover-bg);
  color: var(--win11-text);
}

.win11-input-number__btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.win11-input-number__decrease {
  border-right: 1px solid var(--win11-border);
}

.win11-input-number__increase {
  border-left: 1px solid var(--win11-border);
}
</style>
