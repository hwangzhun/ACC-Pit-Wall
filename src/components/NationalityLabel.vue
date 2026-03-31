<script setup lang="ts">
import { computed } from 'vue'
import { getNationalityFlagIso } from '../data/mappings'
import { getNationalityLocalizedName } from '../i18n/mappings'

const props = defineProps<{
  nationalityId: number
}>()

const iso = computed(() => getNationalityFlagIso(props.nationalityId))
const name = computed(() => getNationalityLocalizedName(props.nationalityId))
</script>

<template>
  <span class="nationality-label">
    <span
      v-if="iso"
      class="fi nationality-flag"
      :class="`fi-${iso}`"
      aria-hidden="true"
    />
    <span class="nationality-name">{{ name }}</span>
  </span>
</template>

<style scoped>
.nationality-label {
  display: inline-flex;
  align-items: center;
  gap: 0.35em;
  vertical-align: middle;
}

.nationality-flag {
  flex-shrink: 0;
  border-radius: 2px;
}
</style>
