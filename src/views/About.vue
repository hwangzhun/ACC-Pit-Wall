<template>
  <div class="about-page">
    <Win11Card>
      <template #title>
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-md bg-win11-accent/10 flex items-center justify-center">
            <svg class="w-5 h-5 text-win11-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 class="text-base font-semibold text-win11-text m-0">{{ t('nav.about') }}</h3>
            <p class="text-xs text-win11-text-secondary m-0">{{ t('aboutPage.subtitle') }}</p>
          </div>
        </div>
      </template>

      <div class="space-y-6">
        <div class="win11-about-hero">
          <img :src="logoHorizontalUrl" alt="Logo" class="win11-logo" />
          <h2 class="win11-hero-title">{{ t('title.main') }}</h2>
          <p class="win11-hero-tagline">{{ t('about.tagline') }}</p>
        </div>

        <Win11Divider />

        <div class="about-capabilities">
          <div><strong>{{ t('aboutPage.configure') }}</strong><span>{{ t('aboutPage.configureDescription') }}</span></div>
          <div><strong>{{ t('aboutPage.validate') }}</strong><span>{{ t('aboutPage.validateDescription') }}</span></div>
          <div><strong>{{ t('aboutPage.deploy') }}</strong><span>{{ t('aboutPage.deployDescription') }}</span></div>
        </div>
        <div class="win11-about-content">
          <p class="win11-section-kicker">{{ t('about.heading') }}</p>
          <p class="win11-body">{{ t('about.body') }}</p>
          <p class="win11-body">{{ t('about.body2') }}</p>
        </div>

        <Win11Divider />

        <div class="win11-meta-grid">
          <div class="win11-meta-item">
            <span class="win11-meta-label">{{ t('about.versionLabel') }}</span>
            <div class="win11-meta-value">
              <span class="win11-version-badge">{{ appVersion }}</span>
            </div>
          </div>
          <div v-if="authorDisplay" class="win11-meta-item">
            <span class="win11-meta-label">{{ t('about.authorLabel') }}</span>
            <span class="win11-meta-value">{{ authorDisplay }}</span>
          </div>
          <div v-if="repoUrl" class="win11-meta-item">
            <span class="win11-meta-label">{{ t('about.repoLabel') }}</span>
            <a :href="repoUrl" target="_blank" rel="noopener noreferrer" class="win11-github-link">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              {{ t('about.viewOnGithub') }}
            </a>
          </div>
        </div>
      </div>
    </Win11Card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { t } from '../i18n'
import { Win11Card, Win11Divider } from '../components/win11'
import { currentTheme } from '../i18n'
import logoHorizontalWhiteUrl from '../assets/logo-horizontal-white.svg?url'
import logoHorizontalBlackUrl from '../assets/logo-horizontal-black.svg?url'

const appVersion = __APP_VERSION__
const authorDisplay = __APP_AUTHOR__.trim()
const repoUrl = __APP_REPO_URL__.trim()
const logoHorizontalUrl = computed(() =>
  currentTheme.value === 'light' ? logoHorizontalBlackUrl : logoHorizontalWhiteUrl
)
</script>

<style scoped>
.about-capabilities{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.about-capabilities>div{padding:14px;border:1px solid var(--win11-border);border-radius:9px;background:var(--win11-control-bg);text-align:left}.about-capabilities strong{display:block;margin-bottom:4px;font-size: var(--type-caption);color:var(--win11-text)}.about-capabilities span{font-size: var(--type-caption);line-height:1.45;color:var(--win11-text-secondary)}@media(max-width:650px){.about-capabilities{grid-template-columns:1fr}}
.win11-about-hero {
  @apply flex flex-col items-center text-center py-8;
}

.win11-logo {
  @apply h-12 mb-4 object-contain;
}

.win11-hero-title {
  @apply text-2xl font-bold text-win11-text mb-2;
}

.win11-hero-tagline {
  @apply text-win11-text-secondary;
}

.win11-about-content {
  @apply text-center;
}

.win11-section-kicker {
  @apply text-sm font-semibold text-win11-accent uppercase tracking-wide mb-3;
}

.win11-body {
  @apply text-win11-text leading-relaxed mb-3;
}

.win11-meta-grid {
  @apply grid grid-cols-1 md:grid-cols-3 gap-4;
}

.win11-meta-item {
  @apply flex flex-col gap-2 p-4 rounded-lg;
  @apply bg-win11-control-bg;
}

.win11-meta-label {
  @apply text-xs text-win11-text-secondary uppercase tracking-wide;
}

.win11-meta-value {
  @apply text-win11-text font-medium;
}

.win11-version-badge {
  @apply inline-block px-3 py-1 rounded-full text-sm font-mono;
  @apply bg-win11-surface text-win11-accent;
}

.win11-github-link {
  @apply inline-flex items-center gap-2;
  @apply text-win11-accent hover:text-win11-accent-hover;
  @apply transition-colors duration-200;
}
</style>
