<template>
  <div class="assist-rules-form">
    <el-form :model="assistRules" label-width="180px">
      <el-form-item :label="t('form.disableIdealLine')">
        <el-switch v-model="assistRules.disableIdealLine" :active-value="1" :inactive-value="0" />
        <FieldDescription config-name="assistRules" field-name="disableIdealLine" />
      </el-form-item>
      <el-form-item :label="t('form.disableAutosteer')">
        <el-switch v-model="assistRules.disableAutosteer" :active-value="1" :inactive-value="0" />
        <FieldDescription config-name="assistRules" field-name="disableAutosteer" />
      </el-form-item>
      <el-form-item :label="t('form.stabilityControlLevelMax')">
        <el-slider v-model="assistRules.stabilityControlLevelMax" :min="0" :max="100" />
        <FieldDescription config-name="assistRules" field-name="stabilityControlLevelMax" />
      </el-form-item>
      <el-form-item :label="t('form.disableAutoPitLimiter')">
        <el-switch v-model="assistRules.disableAutoPitLimiter" :active-value="1" :inactive-value="0" />
        <FieldDescription config-name="assistRules" field-name="disableAutoPitLimiter" />
      </el-form-item>
      <el-form-item :label="t('form.disableAutoGear')">
        <el-switch v-model="assistRules.disableAutoGear" :active-value="1" :inactive-value="0" />
        <FieldDescription config-name="assistRules" field-name="disableAutoGear" />
      </el-form-item>
      <el-form-item :label="t('form.disableAutoClutch')">
        <el-switch v-model="assistRules.disableAutoClutch" :active-value="1" :inactive-value="0" />
        <FieldDescription config-name="assistRules" field-name="disableAutoClutch" />
      </el-form-item>
      <el-form-item :label="t('form.disableAutoEngineStart')">
        <el-switch v-model="assistRules.disableAutoEngineStart" :active-value="1" :inactive-value="0" />
        <FieldDescription config-name="assistRules" field-name="disableAutoEngineStart" />
      </el-form-item>
      <el-form-item :label="t('form.disableAutoWiper')">
        <el-switch v-model="assistRules.disableAutoWiper" :active-value="1" :inactive-value="0" />
        <FieldDescription config-name="assistRules" field-name="disableAutoWiper" />
      </el-form-item>
      <el-form-item :label="t('form.disableAutoLights')">
        <el-switch v-model="assistRules.disableAutoLights" :active-value="1" :inactive-value="0" />
        <FieldDescription config-name="assistRules" field-name="disableAutoLights" />
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import type { AssistRules } from '../types/configuration'
import FieldDescription from './FieldDescription.vue'
import { t } from '../i18n'

defineProps<{
  assistRules: AssistRules
}>()
</script>

<style scoped>
.assist-rules-form {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

:deep(.field-description) {
  margin-left: 8px;
}
</style>
