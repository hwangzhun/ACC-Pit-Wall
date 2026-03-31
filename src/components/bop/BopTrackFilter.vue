<template>
  <div class="track-filter">
    <div class="filter-header">
      <h4>筛选</h4>
      <el-tag size="small" type="info">{{ entries.length }}条</el-tag>
    </div>

    <div class="class-filter">
      <span class="filter-label">车型分类:</span>
      <el-radio-group v-model="filter.carClass" size="small">
        <el-radio-button label="all">全部</el-radio-button>
        <el-radio-button label="GT3">GT3</el-radio-button>
        <el-radio-button label="GT4">GT4</el-radio-button>
        <el-radio-button label="GT2">GT2</el-radio-button>
      </el-radio-group>
    </div>
  </div>
</template>

<script setup lang="ts">
interface BopEntry {
  track: string
  carModel: number
  ballastKg: number
  restrictor: number
}

defineProps<{
  filter: {
    carClass: 'all' | 'GT3' | 'GT4' | 'GT2'
    searchKeyword: string
  }
  entries: BopEntry[]
}>()

// Emit defined for future extensibility
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type EmitType = (e: 'update:filter', value: { carClass: string; searchKeyword: string }) => void
defineEmits<EmitType>()
</script>

<style scoped>
.track-filter {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px;
  gap: 12px;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--el-border-color-light);
}

.filter-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.class-filter {
  flex-shrink: 0;
}

.filter-label {
  display: block;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-bottom: 8px;
}

.class-filter .el-radio-group {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.class-filter :deep(.el-radio-button__inner) {
  padding: 4px 8px;
  font-size: 12px;
}
</style>
