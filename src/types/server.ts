export interface SshConfig {
  host: string
  port: number
  username: string
  password?: string
}

export interface ServerProfile {
  name: string
  config: SshConfig
  serverPath?: string
  description?: string
  createdAt: string
}

export interface ServerListItem {
  name: string
  host: string
  port: number
  username: string
  serverPath?: string
  description?: string
  createdAt: string
}