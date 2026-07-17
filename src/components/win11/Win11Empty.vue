<template>
  <div class="win11-empty">
    <div class="win11-empty-icon">
      <slot name="image">
        <svg class="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      </slot>
    </div>
    <p v-if="description" class="win11-empty-description">{{ description }}</p>
    <div v-if="$slots.default" class="win11-empty-actions">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  description?: string
}>(), {
  description: ''
})
</script>

<style scoped>
.win11-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.win11-empty-icon {
  margin-bottom: 16px;
  color: var(--win11-text-secondary);
  opacity: 0.4;
}

.win11-empty-description {
  margin: 0;
  font-size: var(--type-body);
  color: var(--win11-text-secondary);
}

.win11-empty-actions {
  margin-top: 20px;
}
</style>
