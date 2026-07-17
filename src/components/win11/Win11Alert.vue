<template>
  <div class="win11-alert" :class="`win11-alert--${type}`">
    <div v-if="showIcon" class="win11-alert-icon">
      <svg v-if="type === 'success'" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <svg v-else-if="type === 'warning'" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <svg v-else-if="type === 'error'" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <svg v-else class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
    <div class="win11-alert-content">
      <p v-if="title" class="win11-alert-title">{{ title }}</p>
      <p v-if="description || $slots.default" class="win11-alert-description">
        <slot>{{ description }}</slot>
      </p>
    </div>
    <button v-if="closable" class="win11-alert-close" @click="handleClose">
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  type?: 'success' | 'warning' | 'error' | 'info'
  title?: string
  description?: string
  showIcon?: boolean
  closable?: boolean
}>(), {
  type: 'info',
  showIcon: true,
  closable: false
})

const emit = defineEmits<{
  'close': []
}>()

function handleClose() {
  emit('close')
}
</script>

<style scoped>
.win11-alert {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 8px;
  border: 1px solid;
}

.win11-alert--success {
  background: rgba(16, 124, 16, 0.1);
  border-color: rgba(16, 124, 16, 0.3);
  color: #107c10;
}

.win11-alert--warning {
  background: rgba(255, 140, 0, 0.1);
  border-color: rgba(255, 140, 0, 0.3);
  color: #ff8c00;
}

.win11-alert--error {
  background: rgba(209, 52, 56, 0.1);
  border-color: rgba(209, 52, 56, 0.3);
  color: #d13438;
}

.win11-alert--info {
  background: rgba(0, 120, 212, 0.1);
  border-color: rgba(0, 120, 212, 0.3);
  color: #0078d4;
}

.win11-alert-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.win11-alert-content {
  flex: 1;
  min-width: 0;
}

.win11-alert-title {
  margin: 0 0 4px 0;
  font-size: var(--type-body);
  font-weight: var(--weight-emphasis);
  color: var(--win11-text);
}

.win11-alert-description {
  margin: 0;
  font-size: var(--type-body);
  color: var(--win11-text-secondary);
  line-height: 1.5;
}

.win11-alert-close {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 4px;
  color: var(--win11-icon);
  cursor: pointer;
  transition: all 0.15s;
}

.win11-alert-close:hover {
  background: color-mix(in srgb, var(--win11-text) 10%, transparent);
  color: var(--win11-text);
}
</style>
