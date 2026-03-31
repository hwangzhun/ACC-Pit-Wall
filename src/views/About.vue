<template>
  <div class="about-page">
    <div class="about-hero">
      <div class="about-hero-inner">
        <div class="about-hero-logo">
          <img :src="logoHorizontalUrl" alt="Logo" class="logo-horizontal" />
        </div>
        <h1 class="about-hero-title">{{ t('title.main') }}</h1>
        <p class="about-hero-tagline">{{ t('about.tagline') }}</p>
      </div>
    </div>

    <el-card class="about-card" shadow="hover">
      <p class="about-section-kicker">{{ t('about.heading') }}</p>
      <p class="about-body">{{ t('about.body') }}</p>
      <p class="about-body about-body--last">{{ t('about.body2') }}</p>

      <div class="about-meta">
        <div class="meta-item">
          <span class="meta-label">{{ t('about.versionLabel') }}</span>
          <el-tag type="info" effect="plain" round>{{ appVersion }}</el-tag>
        </div>
        <div v-if="authorDisplay.length" class="meta-item">
          <span class="meta-label">{{ t('about.authorLabel') }}</span>
          <span class="meta-value">{{ authorDisplay }}</span>
        </div>
        <div v-if="repoUrl.length" class="meta-item meta-item--link">
          <span class="meta-label">{{ t('about.repoLabel') }}</span>
          <el-link :href="repoUrl" target="_blank" rel="noopener noreferrer" type="primary" class="github-link">
            <el-icon class="github-link-icon"><Link /></el-icon>
            {{ t('about.viewOnGithub') }}
          </el-link>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { Link } from '@element-plus/icons-vue'
import { t } from '../i18n'
import logoHorizontalUrl from '../assets/logo-horizontal.svg?url'

const appVersion = __APP_VERSION__
const authorDisplay = __APP_AUTHOR__.trim()
const repoUrl = __APP_REPO_URL__.trim()
</script>

<style scoped>
.about-page {
  max-width: 680px;
  margin: 0 auto;
  border-radius: 14px;
  overflow: hidden;
  box-shadow:
    0 4px 6px -1px rgba(15, 23, 42, 0.08),
    0 12px 24px -4px rgba(15, 23, 42, 0.12);
}

.about-hero {
  position: relative;
  padding: 36px 32px 40px;
  background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 42%, #0c4a6e 100%);
  color: #f8fafc;
}

.about-hero::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse 80% 60% at 100% 0%, rgba(56, 189, 248, 0.22), transparent 55%);
  pointer-events: none;
}

.about-hero-inner {
  position: relative;
  z-index: 1;
}

.about-hero-logo {
  margin-bottom: 18px;
}

.logo-horizontal {
  display: block;
  max-height: 52px;
  max-width: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
}

.about-hero-title {
  margin: 0 0 12px;
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.25;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.about-hero-tagline {
  margin: 0;
  font-size: 15px;
  line-height: 1.55;
  color: rgba(248, 250, 252, 0.88);
  max-width: 36em;
}

.about-card {
  border: none;
  border-radius: 0;
}

.about-card :deep(.el-card__body) {
  padding: 28px 32px 32px;
}

.about-section-kicker {
  margin: 0 0 14px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #64748b;
}

.about-body {
  margin: 0 0 14px;
  font-size: 14px;
  line-height: 1.7;
  color: #334155;
}

.about-body--last {
  margin-bottom: 8px;
}

.about-meta {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 22px;
  padding-top: 22px;
  border-top: 1px solid #e2e8f0;
}

.meta-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 16px;
  min-height: 32px;
}

.meta-item--link {
  align-items: center;
}

.meta-label {
  flex: 0 0 100px;
  width: 100px;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;
  color: #64748b;
}

.meta-value {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  line-height: 1.5;
  color: #1e293b;
}

.github-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 500;
}

.github-link-icon {
  font-size: 16px;
}
</style>
