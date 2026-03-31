/// <reference types="@tauri-apps/api" />

declare global {
  interface Window {
    __TAURI__?: any
  }

  /** 由 Vite `define` 注入，与 package.json version 一致 */
  const __APP_VERSION__: string
  /** 由 Vite `define` 注入，来自 package.json author */
  const __APP_AUTHOR__: string
  /** 由 Vite `define` 注入，来自 package.json repository */
  const __APP_REPO_URL__: string
}

export {}
