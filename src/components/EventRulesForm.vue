<template>
  <div class="event-rules-form">
    <el-form :model="eventRules" label-width="200px">
      <el-form-item :label="t('form.pitWindowLengthSec')">
        <el-input-number v-model="eventRules.pitWindowLengthSec" :min="-1" />
        <FieldDescription config-name="eventRules" field-name="pitWindowLengthSec" />
      </el-form-item>
      <el-form-item :label="t('form.driverStintTimeSec')">
        <el-input-number v-model="eventRules.driverStintTimeSec" :min="0" />
        <FieldDescription config-name="eventRules" field-name="driverStintTimeSec" />
      </el-form-item>
      <el-form-item :label="t('form.mandatoryPitstopCount')">
        <el-input-number v-model="eventRules.mandatoryPitstopCount" :min="0" />
        <FieldDescription config-name="eventRules" field-name="mandatoryPitstopCount" />
      </el-form-item>
      <el-form-item :label="t('form.maxTotalDrivingTime')">
        <el-input-number v-model="eventRules.maxTotalDrivingTime" :min="0" />
        <FieldDescription config-name="eventRules" field-name="maxTotalDrivingTime" />
      </el-form-item>
      <el-form-item :label="t('form.maxDriversCount')">
        <el-input-number v-model="eventRules.maxDriversCount" :min="1" :max="5" />
        <FieldDescription config-name="eventRules" field-name="maxDriversCount" />
      </el-form-item>
      <el-form-item :label="t('form.tyreSetCount')">
        <el-input-number v-model="eventRules.tyreSetCount" :min="1" :max="50" />
        <FieldDescription config-name="eventRules" field-name="tyreSetCount" />
      </el-form-item>
      <el-divider />
      <el-form-item :label="t('form.isRefuellingAllowedInRace')">
        <el-switch v-model="eventRules.isRefuellingAllowedInRace" />
        <FieldDescription config-name="eventRules" field-name="isRefuellingAllowedInRace" />
      </el-form-item>
      <el-form-item :label="t('form.isRefuellingTimeFixed')">
        <el-switch v-model="eventRules.isRefuellingTimeFixed" />
        <FieldDescription config-name="eventRules" field-name="isRefuellingTimeFixed" />
      </el-form-item>
      <el-form-item :label="t('form.isMandatoryPitstopRefuellingRequired')">
        <el-switch v-model="eventRules.isMandatoryPitstopRefuellingRequired" />
        <FieldDescription config-name="eventRules" field-name="isMandatoryPitstopRefuellingRequired" />
      </el-form-item>
      <el-form-item :label="t('form.isMandatoryPitstopTyreChangeRequired')">
        <el-switch v-model="eventRules.isMandatoryPitstopTyreChangeRequired" />
        <FieldDescription config-name="eventRules" field-name="isMandatoryPitstopTyreChangeRequired" />
      </el-form-item>
      <el-form-item :label="t('form.isMandatoryPitstopSwapDriverRequired')">
        <el-switch v-model="eventRules.isMandatoryPitstopSwapDriverRequired" />
        <FieldDescription config-name="eventRules" field-name="isMandatoryPitstopSwapDriverRequired" />
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import type { EventRules } from '../types/configuration'
import FieldDescription from './FieldDescription.vue'
import { t } from '../i18n'

defineProps<{
  eventRules: EventRules
}>()
</script>

<style scoped>
.event-rules-form {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

:deep(.field-description) {
  margin-left: 8px;
}
</style>
