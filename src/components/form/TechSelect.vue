<template>
  <div class="tech-form-field">
    <label v-if="label" class="tech-label">
      {{ label }}
    </label>
    <div class="tech-select-wrapper" ref="wrapperRef">
      <button
        type="button"
        class="tech-select-trigger"
        :class="{ 'is-open': isOpen, 'has-error': error, 'is-disabled': disabled }"
        :disabled="disabled"
        @click="toggleDropdown"
      >
        <span class="tech-select-value">
          {{ selectedLabel || placeholder }}
        </span>
        <svg class="tech-select-arrow" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      </button>

      <Transition name="dropdown">
        <div v-if="isOpen" class="tech-select-dropdown">
          <div class="tech-select-search" v-if="searchable">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search..."
              class="tech-select-search-input"
              @click.stop
            />
          </div>
          <div class="tech-select-options">
            <button
              v-for="option in filteredOptions"
              :key="option.value"
              type="button"
              class="tech-select-option"
              :class="{ 'is-selected': option.value === modelValue }"
              @click="selectOption(option)"
            >
              <span>{{ option.label }}</span>
              <svg v-if="option.value === modelValue" class="w-4 h-4 text-neon-blue" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
            </button>
            <div v-if="filteredOptions.length === 0" class="tech-select-empty">
              No options found
            </div>
          </div>
        </div>
      </Transition>
    </div>
    <p v-if="error" class="tech-error">{{ error }}</p>
    <p v-else-if="hint" class="tech-hint">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

interface Option {
  label: string
  value: string | number
}

const props = withDefaults(defineProps<{
  modelValue: string | number
  options: Option[]
  label?: string
  placeholder?: string
  disabled?: boolean
  error?: string
  hint?: string
  searchable?: boolean
}>(), {
  placeholder: 'Select...',
  searchable: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

const isOpen = ref(false)
const searchQuery = ref('')
const wrapperRef = ref<HTMLElement>()

const selectedOption = computed(() => {
  return props.options.find(opt => opt.value === props.modelValue)
})

const selectedLabel = computed(() => {
  return selectedOption.value?.label
})

const filteredOptions = computed(() => {
  if (!searchQuery.value) return props.options
  const query = searchQuery.value.toLowerCase()
  return props.options.filter(opt =>
    opt.label.toLowerCase().includes(query)
  )
})

function toggleDropdown() {
  if (!props.disabled) {
    isOpen.value = !isOpen.value
    if (isOpen.value) {
      searchQuery.value = ''
    }
  }
}

function selectOption(option: Option) {
  emit('update:modelValue', option.value)
  isOpen.value = false
}

function handleClickOutside(event: MouseEvent) {
  if (wrapperRef.value && !wrapperRef.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
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

.tech-select-wrapper {
  @apply relative;
}

.tech-select-trigger {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.625rem 1rem;
  font-size: var(--type-body);
  text-align: left;
  background: var(--win11-surface);
  border: 2px solid var(--win11-border);
  border-radius: 0.5rem;
  color: var(--win11-text);
  @apply transition-all duration-200;
  @apply focus:outline-none focus:border-win11-accent focus:ring-2 focus:ring-win11-accent/20;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
}

.tech-select-trigger:hover {
  border-color: var(--win11-text-secondary);
}

.tech-select-trigger.has-error {
  border-color: #f56c6c;
}

.tech-select-trigger.is-open {
  border-color: var(--win11-accent);
}

.tech-select-value {
  @apply flex-1 truncate;
}

.tech-select-arrow {
  @apply w-5 h-5 ml-2 transition-transform duration-200;
  color: var(--win11-text-secondary);
}

.tech-select-trigger.is-open .tech-select-arrow {
  @apply rotate-180;
}

.tech-select-dropdown {
  position: absolute;
  z-index: 50;
  width: 100%;
  margin-top: 0.5rem;
  background: var(--win11-surface);
  border: 1px solid var(--win11-border);
  border-radius: 0.5rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.tech-select-search {
  @apply p-2;
  border-bottom: 1px solid var(--win11-border);
}

.tech-select-search-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  font-size: var(--type-body);
  background: var(--win11-control-bg);
  border: 1px solid var(--win11-border);
  border-radius: 0.25rem;
  color: var(--win11-text);
  @apply focus:outline-none focus:border-win11-accent;
}

.tech-select-options {
  @apply max-h-60 overflow-y-auto;
}

.tech-select-option {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.625rem 1rem;
  font-size: var(--type-body);
  text-align: left;
  color: var(--win11-text);
  @apply transition-colors duration-150;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
}

.tech-select-option:hover {
  background: var(--win11-control-hover-bg);
}

.tech-select-option.is-selected {
  color: var(--win11-accent);
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.tech-select-empty {
  @apply px-4 py-3 text-sm text-center;
  color: var(--win11-text-secondary);
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
