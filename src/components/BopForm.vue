<template>
  <div class="bop-form">
    <div class="header">
      <h3>性能平衡(BOP)设置</h3>
      <div class="header-actions">
        <el-button type="success" :icon="Download" @click="openImportDialog">从LFM导入</el-button>
        <el-button type="primary" :icon="Plus" @click="addBopEntry">添加BOP条目</el-button>
      </div>
    </div>

    <div class="bop-list">
      <el-card
        v-for="(bopEntry, index) in bop.entries"
        :key="index"
        class="bop-entry"
      >
        <template #header>
          <div class="bop-header">
            <div class="bop-header-left">
              <el-image
                v-if="getCarImageUrl(bopEntry.carModel)"
                :src="getCarImageUrl(bopEntry.carModel)!"
                class="car-thumbnail"
                fit="cover"
                @error="handleImageError"
              >
                <template #error>
                  <div class="image-slot">
                    <el-icon><Picture /></el-icon>
                  </div>
                </template>
              </el-image>
              <span>{{ bopEntry.track }} - {{ getCarName(bopEntry.carModel) }}</span>
            </div>
            <el-button
              type="danger"
              size="small"
              :icon="Delete"
              circle
              @click="removeBopEntry(index)"
            />
          </div>
        </template>

        <el-form :model="bopEntry" label-width="150px">
          <el-form-item label="赛道">
            <el-select v-model="bopEntry.track" placeholder="选择赛道" filterable>
              <el-option v-for="opt in trackOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
            <FieldDescription config-name="bop" field-name="track" />
          </el-form-item>
          <el-form-item label="车型">
            <el-select v-model="bopEntry.carModel" placeholder="选择车型" filterable>
              <el-option v-for="car in carOptions" :key="car.value" :label="car.label" :value="car.value" />
            </el-select>
            <FieldDescription config-name="bop" field-name="carModel" />
          </el-form-item>
          <el-form-item label="配重(kg)">
            <el-input-number v-model="bopEntry.ballastKg" :min="-100" :max="100" />
            <FieldDescription config-name="bop" field-name="ballastKg" />
          </el-form-item>
          <el-form-item label="进气限制器(%)">
            <el-input-number v-model="bopEntry.restrictor" :min="0" :max="20" />
            <FieldDescription config-name="bop" field-name="restrictor" />
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <el-empty v-if="bop.entries.length === 0" description="暂无BOP设置">
      <el-button type="primary" @click="openImportDialog">从LFM导入BOP数据</el-button>
    </el-empty>

    <el-dialog v-model="importDialogVisible" title="从LFM导入BOP数据" width="400px">
      <el-form label-width="80px">
        <el-form-item label="赛道">
          <el-select v-model="importForm.track" placeholder="选择赛道" filterable style="width: 100%">
            <el-option v-for="opt in trackOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="规格">
          <el-select v-model="importForm.carClass" placeholder="选择规格" filterable style="width: 100%">
            <el-option label="GT3" value="GT3" />
            <el-option label="GT4" value="GT4" />
            <el-option label="GT2" value="GT2" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmImport">确认导入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { Delete, Plus, Download, Picture } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { Bop, BopEntry } from '../types/configuration'
import { TRACKS } from '../types/defaults'
import { getTrackOptions, getCarModelSelectOptionsForBop, getCarLocalizedName } from '../i18n/mappings'
import { getCarImageUrl } from '../data/mappings'
import { generateSampleBopData, generateBopJson, type CarClass } from '../utils/lfmBopService'
import FieldDescription from './FieldDescription.vue'

const props = defineProps<{
  bop: Bop
}>()

const emit = defineEmits<{
  (e: 'update:bop', value: Bop): void
}>()

const trackOptions = computed(() => getTrackOptions())

const carOptions = computed(() => getCarModelSelectOptionsForBop())

const defaultLfmImportTrack = TRACKS[0] ?? 'monza'
const importDialogVisible = ref(false)
const importForm = reactive({
  track: defaultLfmImportTrack,
  carClass: 'GT3' as CarClass
})

function getCarName(carId: number): string {
  return getCarLocalizedName(carId)
}

function handleImageError() {
  // 图片加载失败时不做任何处理，el-image 会自动显示 error slot
}

function addBopEntry() {
  const newEntry: BopEntry = {
    track: 'monza',
    carModel: 0,
    ballastKg: 0,
    restrictor: 0
  }
  props.bop.entries.push(newEntry)
  emit('update:bop', props.bop)
}

function removeBopEntry(index: number) {
  props.bop.entries.splice(index, 1)
  emit('update:bop', props.bop)
}

function openImportDialog() {
  importForm.track = defaultLfmImportTrack
  importForm.carClass = 'GT3'
  importDialogVisible.value = true
}

function confirmImport() {
  const sampleData = generateSampleBopData(importForm.track, importForm.carClass)

  props.bop.entries.length = 0
  props.bop.entries.push(...sampleData)

  const jsonContent = generateBopJson(props.bop.entries)
  console.log('生成的 BOP JSON:', jsonContent)

  const trackLabel = importForm.track
  ElMessage.success(`成功导入 ${trackLabel} 的 ${importForm.carClass} 数据 (${sampleData.length} 条)`)
  emit('update:bop', props.bop)
  importDialogVisible.value = false
}
</script>

<style scoped>
.bop-form {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h3 {
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.bop-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.bop-entry {
  margin-bottom: 16px;
}

.bop-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.bop-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.car-thumbnail {
  width: 80px;
  height: 50px;
  border-radius: 4px;
  object-fit: cover;
}

.image-slot {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 80px;
  height: 50px;
  background: #f5f7fa;
  border-radius: 4px;
  color: #909399;
  font-size: 24px;
}

.el-form-item {
  margin-bottom: 12px;
}

:deep(.field-description) {
  margin-left: 8px;
}
</style>