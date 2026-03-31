<template>
  <div class="configuration-form">
    <el-form :model="configuration" label-width="180px">
      <el-form-item :label="t('form.udpPort')">
        <el-input-number v-model="configuration.udpPort" :min="1024" :max="65535" />
        <FieldDescription config-name="configuration" field-name="udpPort" />
      </el-form-item>
      <el-form-item :label="t('form.tcpPort')">
        <el-input-number v-model="configuration.tcpPort" :min="1024" :max="65535" />
        <FieldDescription config-name="configuration" field-name="tcpPort" />
      </el-form-item>
      <el-form-item :label="t('form.maxConnections')">
        <el-input-number v-model="configuration.maxConnections" :min="1" :max="100" />
        <FieldDescription config-name="configuration" field-name="maxConnections" />
      </el-form-item>
      <el-form-item :label="t('form.lanDiscovery')">
        <el-switch v-model="configuration.lanDiscovery" :active-value="1" :inactive-value="0" />
        <FieldDescription config-name="configuration" field-name="lanDiscovery" />
      </el-form-item>
      <el-form-item :label="t('form.registerToLobby')">
        <el-switch v-model="configuration.registerToLobby" :active-value="1" :inactive-value="0" />
        <FieldDescription config-name="configuration" field-name="registerToLobby" />
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import type { Configuration } from '../types/configuration'
import FieldDescription from './FieldDescription.vue'
import { t } from '../i18n'

defineProps<{
  configuration: Configuration
}>()
</script>

<style scoped>
.configuration-form {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

:deep(.field-description) {
  margin-left: 8px;
}
</style>
