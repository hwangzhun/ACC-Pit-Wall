<template>
  <label
    class="win11-radio-button"
    :class="{ 'is-checked': isChecked, 'is-disabled': disabled }"
  >
    <input
      type="radio"
      class="win11-radio-button__input"
      :value="value"
      :disabled="disabled"
      :checked="isChecked"
      @change="handleChange"
    />
    <span class="win11-radio-button__inner">
      <slot>{{ label }}</slot>
    </span>
  </label>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'

const props = withDefaults(defineProps<{
  value?: string | number | boolean
  label?: string
  disabled?: boolean
}>(), {
  disabled: false
})

const radioGroup = inject<{
  modelValue: { value: string | number | boolean }
  buttonStyle: { value: boolean }
  select: (value: string | number | boolean) => void
} | null>('radioGroup', {} as any)

const isChecked = computed(() => {
  if (radioGroup && radioGroup.modelValue) {
    return radioGroup.modelValue.value === props.value
  }
  return false
})

function handleChange() {
  if (!props.disabled && radioGroup) {
    radioGroup.select(props.value!)
  }
}
</script>

<style scoped>
.win11-radio-button {
  position: relative;
  display: inline-flex;
  cursor: pointer;
}

.win11-radio-button__input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.win11-radio-button__inner {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 12px;
  font-size: var(--type-body);
  color: var(--win11-text-secondary);
  background: var(--win11-control-bg);
  border: 1px solid var(--win11-border);
  border-radius: 6px;
  transition: all 0.15s;
  user-select: none;
}

.win11-radio-button:hover .win11-radio-button__inner {
  color: var(--win11-text);
  border-color: var(--win11-accent);
}

.win11-radio-button.is-checked .win11-radio-button__inner {
  color: #ffffff;
  background: var(--win11-accent);
  border-color: var(--win11-accent);
}

.win11-radio-button.is-disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.win11-radio-button.is-disabled .win11-radio-button__inner {
  pointer-events: none;
}
</style>
