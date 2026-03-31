import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8')) as {
  version: string
  author?: string
  repository?: string | { type?: string; url: string }
}

function normalizeRepositoryUrl(repo: typeof pkg.repository): string {
  if (!repo) return ''
  const raw = typeof repo === 'string' ? repo : repo.url
  if (!raw) return ''
  let u = raw.trim()
  u = u.replace(/^git\+/, '')
  if (u.startsWith('git@github.com:')) {
    u = 'https://github.com/' + u.slice('git@github.com:'.length)
  }
  u = u.replace(/^git:/, 'https:')
  return u.replace(/\.git$/i, '')
}

export default defineConfig({
  plugins: [vue()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __APP_AUTHOR__: JSON.stringify(typeof pkg.author === 'string' ? pkg.author.trim() : ''),
    __APP_REPO_URL__: JSON.stringify(normalizeRepositoryUrl(pkg.repository))
  },
  server: {
    port: 3000
  },
  publicDir: resolve(__dirname, 'public'),
  build: {
    copyPublicDir: true
  }
})
