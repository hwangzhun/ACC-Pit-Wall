<template>
  <span
    class="win11-tag"
    :class="[
      `win11-tag--${type}`,
      `win11-tag--${size}`,
      `win11-tag--${effect}`
    ]"
  >
    <slot />
  </span>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  size?: 'small' | 'default'
  effect?: 'light' | 'plain' | 'dark'
}>(), {
  type: 'primary',
  size: 'default',
  effect: 'plain'
})
</script>

<style scoped>
.win11-tag {
  display: inline-flex;
  align-items: center;
  padding: 0 8px;
  font-size: var(--type-caption);
  font-weight: var(--weight-emphasis);
  line-height: 1.6;
  border-radius: 4px;
  white-space: nowrap;
}

.win11-tag--small {
  height: 20px;
  font-size: var(--type-caption);
  padding: 0 6px;
}

.win11-tag--default {
  height: 24px;
}

/* Light effect */
.win11-tag--light {
  border: 1px solid;
}

.win11-tag--light.win11-tag--primary {
  color: #0078d4;
  background: rgba(0, 120, 212, 0.1);
  border-color: rgba(0, 120, 212, 0.3);
}

.win11-tag--light.win11-tag--success {
  color: #107c10;
  background: rgba(16, 124, 16, 0.1);
  border-color: rgba(16, 124, 16, 0.3);
}

.win11-tag--light.win11-tag--warning {
  color: #ff8c00;
  background: rgba(255, 140, 0, 0.1);
  border-color: rgba(255, 140, 0, 0.3);
}

.win11-tag--light.win11-tag--danger {
  color: #d13438;
  background: rgba(209, 52, 56, 0.1);
  border-color: rgba(209, 52, 56, 0.3);
}

.win11-tag--light.win11-tag--info {
  color: #6b6b6b;
  background: rgba(107, 107, 107, 0.1);
  border-color: rgba(107, 107, 107, 0.3);
}

/* Plain effect */
.win11-tag--plain {
  border: 1px solid transparent;
}

.win11-tag--plain.win11-tag--primary {
  color: #ffffff;
  background: #0078d4;
}

:root.light .win11-tag--plain.win11-tag--primary {
  color: #ffffff;
}

.win11-tag--plain.win11-tag--success {
  color: #ffffff;
  background: #107c10;
}

:root.light .win11-tag--plain.win11-tag--success {
  color: #ffffff;
}

.win11-tag--plain.win11-tag--warning {
  color: #ffffff;
  background: #ff8c00;
}

:root.light .win11-tag--plain.win11-tag--warning {
  color: #ffffff;
}

.win11-tag--plain.win11-tag--danger {
  color: #ffffff;
  background: #d13438;
}

:root.light .win11-tag--plain.win11-tag--danger {
  color: #ffffff;
}

.win11-tag--plain.win11-tag--info {
  color: #ffffff;
  background: #6b6b6b;
}

:root.light .win11-tag--plain.win11-tag--info {
  color: #ffffff;
}

/* Dark effect */
.win11-tag--dark {
  border: 1px solid;
}

.win11-tag--dark.win11-tag--primary {
  color: #ffffff;
  background: rgba(0, 120, 212, 0.8);
  border-color: #0078d4;
}

:root.light .win11-tag--dark.win11-tag--primary {
  color: #ffffff;
  background: rgba(0, 120, 212, 0.9);
  border-color: #0078d4;
}

.win11-tag--dark.win11-tag--success {
  color: #ffffff;
  background: rgba(16, 124, 16, 0.8);
  border-color: #107c10;
}

:root.light .win11-tag--dark.win11-tag--success {
  color: #ffffff;
  background: rgba(16, 124, 16, 0.9);
  border-color: #107c10;
}

.win11-tag--dark.win11-tag--warning {
  color: #ffffff;
  background: rgba(255, 140, 0, 0.8);
  border-color: #ff8c00;
}

:root.light .win11-tag--dark.win11-tag--warning {
  color: #ffffff;
  background: rgba(255, 140, 0, 0.9);
  border-color: #ff8c00;
}

.win11-tag--dark.win11-tag--danger {
  color: #ffffff;
  background: rgba(209, 52, 56, 0.8);
  border-color: #d13438;
}

:root.light .win11-tag--dark.win11-tag--danger {
  color: #ffffff;
  background: rgba(209, 52, 56, 0.9);
  border-color: #d13438;
}

.win11-tag--dark.win11-tag--info {
  color: #ffffff;
  background: rgba(107, 107, 107, 0.8);
  border-color: #6b6b6b;
}

:root.light .win11-tag--dark.win11-tag--info {
  color: #ffffff;
  background: rgba(107, 107, 107, 0.9);
  border-color: #6b6b6b;
}
</style>
