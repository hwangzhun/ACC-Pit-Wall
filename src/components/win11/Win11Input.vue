<template>
  <div class="win11-input-wrapper" :class="{ 'has-prefix': $slots.prefix || prefixIcon }">
    <div class="relative flex items-center">
      <span v-if="$slots.prefix || prefixIcon" class="win11-input-prefix">
        <slot name="prefix">
          <svg v-if="prefixIcon === 'search'" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </slot>
      </span>
      <input
        :id="inputId"
        :type="effectiveInputType"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :maxlength="maxlength"
        class="win11-input"
        :class="[
          `win11-input--${size}`,
          {
            'has-trailing-1': hasTrailingActions && trailingSlotCount === 1,
            'has-trailing-2': hasTrailingActions && trailingSlotCount === 2,
            'win11-input--hide-native-reveal': showPasswordToggle && type === 'password',
            'error': error,
            'has-prefix': $slots.prefix || prefixIcon
          }
        ]"
        @input="handleInput"
        @change="emit('change', ($event.target as HTMLInputElement).value)"
      />
      <div v-if="hasTrailingActions" class="win11-input-trailing">
        <button
          v-if="clearable && modelValue"
          type="button"
          class="win11-input-trailing-btn"
          @click="handleClear"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <button
          v-if="showPasswordToggle && type === 'password'"
          type="button"
          class="win11-input-trailing-btn"
          :title="passwordPlain ? hidePasswordTitle : showPasswordTitle"
          :aria-label="passwordPlain ? hidePasswordTitle : showPasswordTitle"
          :aria-pressed="passwordPlain"
          @click="passwordPlain = !passwordPlain"
        >
          <svg v-if="passwordPlain" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
          </svg>
          <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </button>
      </div>
      <span v-if="maxlength && showWordLimit" class="win11-input-count">
        {{ String(modelValue || '').length }}/{{ maxlength }}
      </span>
    </div>
    <p v-if="error" class="win11-error">{{ error }}</p>
    <p v-else-if="hint" class="win11-hint">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { t } from '../../i18n'

const props = withDefaults(defineProps<{
  modelValue?: string | number
  type?: string
  placeholder?: string
  disabled?: boolean
  error?: string
  hint?: string
  id?: string
  size?: 'small' | 'default' | 'large'
  clearable?: boolean
  prefixIcon?: 'search' | string
  maxlength?: number | string
  showWordLimit?: boolean
  /**
   * 在 type 为 password 时显示「显示/隐藏密码」切换。
   * WebView2/Chromium 原生 ::ms-reveal 在失焦后常不再出现，故用自绘按钮并隐藏原生以免重复。
   */
  showPasswordToggle?: boolean
}>(), {
  modelValue: '',
  type: 'text',
  placeholder: '',
  disabled: false,
  size: 'default',
  clearable: false,
  showWordLimit: false,
  showPasswordToggle: false
})

const passwordPlain = ref(false)

const effectiveInputType = computed(() => {
  if (props.type === 'password' && props.showPasswordToggle) {
    return passwordPlain.value ? 'text' : 'password'
  }
  return props.type
})

function hasClearableValue(): boolean {
  const v = props.modelValue
  if (v === undefined || v === null) return false
  if (typeof v === 'number') return true
  return String(v).length > 0
}

const hasTrailingActions = computed(
  () => (props.clearable && hasClearableValue()) || (props.showPasswordToggle && props.type === 'password')
)

const trailingSlotCount = computed(() => {
  let n = 0
  if (props.clearable && hasClearableValue()) n++
  if (props.showPasswordToggle && props.type === 'password') n++
  return n
})

const showPasswordTitle = computed(() => t('common.showPassword'))
const hidePasswordTitle = computed(() => t('common.hidePassword'))

watch(
  () => [props.type, props.showPasswordToggle] as const,
  () => {
    passwordPlain.value = false
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'change': [value: string]
  'clear': []
}>()

const inputId = computed(() => props.id || `input-${Math.random().toString(36).slice(2, 9)}`)

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}

function handleClear() {
  emit('update:modelValue', '')
  emit('clear')
}
</script>

<style scoped>
.win11-input-wrapper {
  @apply w-full relative;
}

.win11-input {
  @apply w-full rounded-md;
  @apply bg-win11-control-bg text-win11-text text-sm;
  @apply border border-transparent;
  @apply transition-colors duration-200;
  @apply outline-none;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
}

.win11-input--small {
  @apply h-8 px-2 py-1 text-xs;
}

.win11-input--default {
  @apply h-10 px-3 py-2;
}

.win11-input--large {
  @apply h-12 px-4 py-3 text-base;
}

.win11-input::placeholder {
  @apply text-win11-text-secondary;
}

.win11-input:focus {
  @apply border-win11-accent;
  box-shadow: 0 0 0 1px var(--win11-accent);
}

.win11-input.has-prefix {
  padding-left: 36px;
}

.win11-input.has-trailing-1 {
  padding-right: 2.5rem;
}

.win11-input.has-trailing-2 {
  padding-right: 4.25rem;
}

/* WebView2 / Edge：有内容后会出现内置「显示密码」，与自定义按钮重复 */
.win11-input--hide-native-reveal::-ms-reveal,
.win11-input--hide-native-reveal::-ms-clear {
  display: none !important;
}

.win11-input-trailing {
  @apply absolute right-1.5 top-1/2 -translate-y-1/2 z-[1];
  @apply flex items-center gap-0.5;
}

.win11-input-trailing-btn {
  @apply w-6 h-6 p-0 rounded shrink-0;
  @apply flex items-center justify-center;
  @apply bg-transparent border-none;
  @apply text-win11-text-secondary;
  @apply cursor-pointer;
  @apply transition-colors duration-150;
}

.win11-input-trailing-btn:hover {
  @apply text-win11-text;
  background: var(--win11-control-hover-bg);
}

.win11-input-prefix {
  @apply absolute left-3 top-1/2 -translate-y-1/2;
  @apply text-win11-text-secondary;
  @apply pointer-events-none;
}

.win11-input-count {
  @apply absolute right-3 top-1/2 -translate-y-1/2;
  @apply text-xs text-win11-text-secondary;
  pointer-events: none;
}

.win11-hint {
  @apply text-xs text-win11-text-secondary mt-1;
}
</style>
