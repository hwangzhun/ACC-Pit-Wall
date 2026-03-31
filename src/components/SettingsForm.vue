<template>
  <div class="settings-form">
    <!-- 服务器基本设置 -->
    <el-card class="section-card">
      <template #header>
        <h3>{{ t('nav.settings') }}</h3>
      </template>
      <el-form :model="settings" label-width="180px">
        <el-form-item :label="t('form.serverName')">
          <el-input v-model="settings.serverName" :placeholder="t('placeholder.pleaseInput')" />
          <FieldDescription config-name="settings" field-name="serverName" />
        </el-form-item>
        <el-form-item :label="t('form.password')">
          <el-input v-model="settings.password" type="password" :placeholder="t('common.optional')" show-password />
          <FieldDescription config-name="settings" field-name="password" />
        </el-form-item>
        <el-form-item :label="t('form.adminPassword')">
          <el-input v-model="settings.adminPassword" type="password" :placeholder="t('placeholder.pleaseInput')" show-password />
          <FieldDescription config-name="settings" field-name="adminPassword" />
        </el-form-item>
        <el-form-item :label="t('form.spectatorPassword')">
          <el-input v-model="settings.spectatorPassword" type="password" :placeholder="t('common.optional')" show-password />
          <FieldDescription config-name="settings" field-name="spectatorPassword" />
        </el-form-item>
        <el-form-item :label="t('form.carGroup')">
          <el-select v-model="settings.carGroup" :placeholder="t('common.pleaseSelect')" filterable>
            <el-option v-for="group in carGroups" :key="group" :label="group" :value="group" />
          </el-select>
          <FieldDescription config-name="settings" field-name="carGroup" />
        </el-form-item>
        <el-form-item :label="t('form.maxCarSlots')">
          <el-input-number v-model="settings.maxCarSlots" :min="1" :max="60" />
          <FieldDescription config-name="settings" field-name="maxCarSlots" />
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 评分要求 -->
    <el-card class="section-card">
      <template #header>
        <h3>{{ t('form.ratingRequirements') }}</h3>
      </template>
      <el-form :model="settings" label-width="180px">
        <el-form-item :label="t('form.trackMedalsRequirement')">
          <el-select v-model="settings.trackMedalsRequirement" :placeholder="t('common.pleaseSelect')" filterable>
            <el-option :label="t('common.none')" :value="0" />
            <el-option label="1" :value="1" />
            <el-option label="2" :value="2" />
            <el-option label="3" :value="3" />
          </el-select>
          <FieldDescription config-name="settings" field-name="trackMedalsRequirement" />
        </el-form-item>
        <el-form-item :label="t('form.safetyRatingRequirement')">
          <el-input-number v-model="settings.safetyRatingRequirement" :min="-1" :max="99" />
          <FieldDescription config-name="settings" field-name="safetyRatingRequirement" />
        </el-form-item>
        <el-form-item :label="t('form.racecraftRatingRequirement')">
          <el-input-number v-model="settings.racecraftRatingRequirement" :min="-1" :max="99" />
          <FieldDescription config-name="settings" field-name="racecraftRatingRequirement" />
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 赛事选项 -->
    <el-card class="section-card">
      <template #header>
        <h3>{{ t('form.raceOptions') }}</h3>
      </template>
      <el-form :model="settings" label-width="220px">
        <el-form-item :label="t('form.isRaceLocked')">
          <el-switch v-model="settings.isRaceLocked" :active-value="1" :inactive-value="0" />
          <FieldDescription config-name="settings" field-name="isRaceLocked" />
        </el-form-item>
        <el-form-item :label="t('form.isLockedPrepPhase')">
          <el-switch v-model="settings.isLockedPrepPhase" :active-value="1" :inactive-value="0" />
          <FieldDescription config-name="settings" field-name="isLockedPrepPhase" />
        </el-form-item>
        <el-form-item :label="t('form.shortFormationLap')">
          <el-switch v-model="settings.shortFormationLap" :active-value="1" :inactive-value="0" />
          <FieldDescription config-name="settings" field-name="shortFormationLap" />
        </el-form-item>
        <el-form-item :label="t('form.allowAutoDQ')">
          <el-switch v-model="settings.allowAutoDQ" :active-value="1" :inactive-value="0" />
          <FieldDescription config-name="settings" field-name="allowAutoDQ" />
        </el-form-item>
        <el-form-item :label="t('form.ignorePrematureDisconnects')">
          <el-switch v-model="settings.ignorePrematureDisconnects" :active-value="1" :inactive-value="0" />
          <FieldDescription config-name="settings" field-name="ignorePrematureDisconnects" />
        </el-form-item>
        <el-form-item :label="t('form.randomizeTrackWhenEmpty')">
          <el-switch v-model="settings.randomizeTrackWhenEmpty" :active-value="1" :inactive-value="0" />
          <FieldDescription config-name="settings" field-name="randomizeTrackWhenEmpty" />
        </el-form-item>
        <el-form-item :label="t('form.dumpLeaderboards')">
          <el-switch v-model="settings.dumpLeaderboards" :active-value="1" :inactive-value="0" />
          <FieldDescription config-name="settings" field-name="dumpLeaderboards" />
        </el-form-item>
        <el-form-item :label="t('form.dumpEntryList')">
          <el-switch v-model="settings.dumpEntryList" :active-value="1" :inactive-value="0" />
          <FieldDescription config-name="settings" field-name="dumpEntryList" />
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import type { Settings } from '../types/configuration'
import { CAR_GROUPS } from '../types/defaults'
import FieldDescription from './FieldDescription.vue'
import { t } from '../i18n'

defineProps<{
  settings: Settings
}>()

const carGroups = CAR_GROUPS
</script>

<style scoped>
.settings-form {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.section-card {
  margin-bottom: 0;
}

.el-form-item {
  margin-bottom: 18px;
}

.section-card :deep(h3) {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

:deep(.field-description) {
  margin-left: 8px;
}
</style>
