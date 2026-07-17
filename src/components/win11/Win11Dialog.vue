<template>
  <Teleport to="body">
    <Transition name="dialog">
      <div
        v-if="visible"
        class="win11-dialog-overlay"
        :style="{ zIndex }"
        @click.self="handleOverlayClick"
      >
        <div class="win11-dialog" :style="{ width: width }">
          <div v-if="$slots.header || title" class="win11-dialog-header">
            <slot name="header">
              <h3 class="win11-dialog-title">{{ title }}</h3>
            </slot>
            <button v-if="showClose" class="win11-dialog-close" @click="handleClose">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div class="win11-dialog-body">
            <slot />
          </div>
          <div v-if="$slots.footer" class="win11-dialog-footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { watch } from 'vue'

const props = withDefaults(defineProps<{
  /** 兼容旧用法 `v-model`（modelValue） */
  modelValue?: boolean
  title?: string
  width?: string
  /** 遮罩与弹窗栈层级，嵌套子弹窗应大于主弹窗 */
  zIndex?: number
  showClose?: boolean
  closeOnClickModal?: boolean
  closeOnPressEscape?: boolean
}>(), {
  width: '500px',
  zIndex: 2000,
  showClose: true,
  closeOnClickModal: true,
  closeOnPressEscape: true
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'open': []
  'close': []
  'closed': []
}>()

const visible = defineModel<boolean>('visible', { default: false })

function handleClose() {
  visible.value = false
  emit('update:modelValue', false)
  emit('close')
}

function handleOverlayClick() {
  if (props.closeOnClickModal) {
    handleClose()
  }
}

watch(() => props.modelValue, (newVal) => {
  visible.value = newVal
  if (newVal) {
    emit('open')
  }
}, { immediate: true })

watch(visible, (newVal) => {
  emit('update:modelValue', newVal)
  if (newVal) {
    emit('open')
  }
})
</script>

<style scoped>
.win11-dialog-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--win11-overlay-scrim);
  backdrop-filter: blur(4px);
}

.win11-dialog {
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  background: var(--win11-surface);
  border: 1px solid var(--win11-border);
  border-radius: 12px;
  box-shadow: var(--win11-shadow-dialog);
  overflow: hidden;
}

.win11-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--win11-border);
  flex-shrink: 0;
}

.win11-dialog-title {
  margin: 0;
  font-size: var(--type-section);
  font-weight: var(--weight-emphasis);
  color: var(--win11-text);
}

.win11-dialog-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: var(--win11-icon);
  cursor: pointer;
  transition: all 0.15s;
}

.win11-dialog-close:hover {
  background: var(--win11-control-hover-bg);
  color: var(--win11-text);
}

.win11-dialog-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 20px;
  color: var(--win11-text);
}

.win11-dialog-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid var(--win11-border);
  flex-shrink: 0;
}

.dialog-enter-active,
.dialog-leave-active {
  transition: opacity 0.2s ease;
}

.dialog-enter-active .win11-dialog,
.dialog-leave-active .win11-dialog {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}

.dialog-enter-from .win11-dialog,
.dialog-leave-to .win11-dialog {
  transform: scale(0.95);
  opacity: 0;
}
</style>
