<template>
  <div class="win11-slider-wrapper">
    <div v-if="label || showValue" class="win11-slider-header">
      <span v-if="label" class="win11-slider-label">{{ label }}</span>
      <span v-if="showValue" class="win11-slider-value">{{ displayValue }}</span>
    </div>
    <div class="win11-slider" ref="sliderRef">
      <div class="win11-slider-track"></div>
      <div class="win11-slider-fill" :style="{ width: fillWidth, backgroundColor: activeColor }"></div>
      <div
        class="win11-slider-thumb"
        :style="{ left: thumbPosition }"
        @mousedown="startDrag"
      ></div>
    </div>
    <div v-if="min !== undefined || max !== undefined" class="win11-slider-range">
      <span v-if="min !== undefined">{{ min }}</span>
      <span v-if="max !== undefined">{{ max }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = withDefaults(defineProps<{
  modelValue?: number
  min?: number
  max?: number
  step?: number
  label?: string
  showValue?: boolean
  unit?: string
  disabled?: boolean
  color?: string
}>(), {
  modelValue: 0,
  min: 0,
  max: 100,
  step: 1,
  showValue: true,
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
  'change': [value: number]
}>()

const isDragging = ref(false)
const sliderRef = ref<HTMLElement | null>(null)

const percentage = computed(() => {
  const range = (props.max ?? 100) - (props.min ?? 0)
  return ((props.modelValue ?? 0) - (props.min ?? 0)) / range * 100
})

const fillWidth = computed(() => `${percentage.value}%`)
const thumbPosition = computed(() => `calc(${percentage.value}% - 8px)`)

const activeColor = computed(() => {
  if (props.color) return props.color
  const pct = percentage.value
  if (pct <= 33) return '#67c23a'
  if (pct <= 66) return '#e6a23c'
  return '#f56c6c'
})

const displayValue = computed(() => {
  return props.unit ? `${props.modelValue}${props.unit}` : `${props.modelValue}`
})

function startDrag(event: MouseEvent) {
  if (props.disabled) return
  
  isDragging.value = true
  updateValue(event)
  
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
}

function onDrag(event: MouseEvent) {
  if (isDragging.value) {
    updateValue(event)
  }
}

function stopDrag() {
  isDragging.value = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  emit('change', props.modelValue)
}

function updateValue(event: MouseEvent) {
  if (!sliderRef.value) return
  
  const rect = sliderRef.value.getBoundingClientRect()
  const x = event.clientX - rect.left
  const pct = Math.max(0, Math.min(1, x / rect.width))
  
  const range = (props.max ?? 100) - (props.min ?? 0)
  let value = (props.min ?? 0) + pct * range
  
  if (props.step) {
    value = Math.round(value / props.step) * props.step
  }
  
value = Number(value.toFixed(10))
  value = Math.max(props.min ?? 0, Math.min(props.max ?? 100, value))

  emit('update:modelValue', value)
}
</script>

<style scoped>
.win11-slider-wrapper {
  @apply w-full;
}

.win11-slider-header {
  @apply flex items-center justify-between mb-2;
}

.win11-slider-label {
  @apply text-sm font-medium text-win11-text;
}

.win11-slider-value {
  @apply text-sm text-win11-text-secondary font-medium;
}

.win11-slider {
  @apply relative w-full h-6 flex items-center cursor-pointer;
}

.win11-slider-track {
  @apply absolute w-full h-1 rounded-full;
  background: var(--win11-control-bg);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.15);
}

.win11-slider-fill {
  @apply absolute h-1 rounded-full;
  @apply transition-all duration-100;
  box-shadow: 0 0 6px rgba(0, 0, 0, 0.2);
}

.win11-slider-thumb {
  @apply absolute w-4 h-4 rounded-full cursor-pointer;
  @apply transition-all duration-100;
  @apply hover:scale-110;
  @apply border-2 border-white;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.1);
  background: linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%);
}

.win11-slider-thumb::after {
  content: '';
  @apply absolute inset-1 rounded-full;
  @apply bg-win11-accent;
  @apply opacity-0 transition-opacity duration-150;
}

.win11-slider-thumb:hover::after {
  @apply opacity-100;
}

.win11-slider-range {
  @apply flex justify-between mt-1 text-xs text-win11-text-secondary;
}
</style>
