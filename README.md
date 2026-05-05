# ACC 赛事服务器配置工具 (ACC Pitwall)

![Logo](https://cdn.jsdelivr.net/gh/hwangzhun/ACC-Pit-Wall@main/src/assets/logo-horizontal-black.svg)

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Vue](https://img.shields.io/badge/Vue-3.5+-4FC08D?logo=vue.js&logoColor=white)
![Tauri](https://img.shields.io/badge/Tauri-2.0+-FFC131?logo=tauri&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-3178C6?logo=typescript&logoColor=white)

[中文版](#中文版-chinese) | [English](#english-version)

</div>

这是一个面向 **Assetto Corsa Competizione (ACC)** 游戏服务器的现代化配置工具。旨在简化复杂的配置文件编辑流程，提供直观的图形化界面，并支持一键远程部署，让赛事服务器的搭建与管理变得前所未有的简单。

A modern configuration tool for **Assetto Corsa Competizione (ACC)** game servers. Designed to simplify the complex process of editing configuration files, it provides an intuitive graphical interface and supports one-click remote deployment.

---

## 中文版 (Chinese)

### ✨ 功能特性

- 🛠️ **全方位配置管理**：可视化编辑所有 7 个核心 ACC 配置文件，告别手动修改 JSON 的烦恼。
- 💾 **预设系统**：一键保存/加载赛事配置，支持多套方案快速切换，轻松应对不同赛事需求。
- 🚀 **SSH 远程部署**：内置 SSH 支持，可直接将配置推送到远程 Windows 服务器并运行。
- 📊 **LFM BOP 集成**：自动获取并导入最新的 LFM (Low Fuel Motorsport) BOP 数据。
- 🏁 **比赛结果下载**：支持从服务器远程获取比赛结果文件。
- 🌍 **国际化支持**：内置中英文切换，适配全球玩家。

### 🚀 快速开始

#### 📥 下载与安装 (推荐)
如果您只是想使用本工具，可以直接下载预编译的安装包：
1. 前往 [Releases](https://github.com/hwangzhun/ACC-Server-Manager/releases) 页面。
2. 下载最新的 `.exe` 安装程序并运行。
**注意**：目前仅支持 Windows 操作系统。

#### 🛠️ 开发与源码构建
1. **前置要求**：Node.js (v18+), npm/yarn, Rust 环境 (仅桌面版构建需要)。
2. **安装依赖**：`npm install`
3. **运行**：`npm run dev` (Web) 或 `npm run tauri dev` (桌面版)。
4. **构建**：`npm run build` 或 `npm run tauri build`。

### 📘 使用指南

1. **基础配置**：在各个表单页面填写服务器参数，字段均有详细说明。
2. **参赛名单管理 (Entrylist)**：
   - **手动添加**：直接编辑车队及车手信息。
   - **CSV 导入（推荐）**：支持批量导入，软件会根据 CSV 中的**队伍名称**自动进行编队。详细格式请参考 [CSV 导入指南 (Entrylist_CSV_Guide.md)](Entrylist_CSV_Guide.md)。
   - **JSON 导入（高级）**：用于结构化备份恢复，导入完整 Entrylist JSON 文件。
   - **对照表**：详情参考 [id_reference.md](id_reference.md)。
3. **BOP 设置**：手动调整或一键导入 LFM BOP 数据。
4. **远程部署流程**：
   - 远程服务器需启用 OpenSSH (可用内置 [install_openssh.ps1](install_openssh.ps1) 脚本)。
   - 配置 SSH 连接信息，确保 `acc-server.zip` 与主程序在同一目录，点击部署并运行。

### 🛡️ 关于安全性
- **风险提示**：连接信息以明文存储。若服务器存有重要资料，建议手动输入密码而非保存。
- **常规使用**：仅用于游戏服务器时，保存密码影响较小。

---

## English Version

### ✨ Features

- 🛠️ **Comprehensive Config Management**: Visually edit all 7 core ACC config files.
- 💾 **Preset System**: Save/load race configurations with one click for quick switching.
- 🚀 **SSH Remote Deployment**: Push configurations directly to a remote Windows server.
- 📊 **LFM BOP Integration**: Automatically fetch and import the latest LFM BOP data.
- 🏁 **Race Results Download**: Fetch race result files from the remote server.
- 🌍 **Internationalization**: Built-in English/Chinese support.

### � Quick Start

#### 📥 Download & Install (Recommended)
1. Go to the [Releases](https://github.com/hwangzhun/ACC-Server-Manager/releases) page.
2. Download and run the latest `.exe` installer.
**Note**: Currently supports Windows only.

#### 🛠️ Development & Build
1. **Prerequisites**: Node.js (v18+), npm/yarn, Rust (for desktop build).
2. **Install**: `npm install`
3. **Run**: `npm run dev` (Web) or `npm run tauri dev` (Desktop).
4. **Build**: `npm run build` or `npm run tauri build`.

### 📘 User Guide

1. **Basic Config**: Fill in server parameters in form pages with detailed descriptions.
2. **Entrylist Management**:
   - **Manual Entry**: Directly add/edit team and driver info.
   - **CSV Import (Recommended)**: Batch import with **auto-grouping** based on team names. See the [CSV Import Guide (Entrylist_CSV_Guide.md)](Entrylist_CSV_Guide.md) for details.
   - **JSON Import (Advanced)**: For structured backup and restore of full Entrylist JSON files.
   - **Reference**: See [id_reference.md](id_reference.md).
3. **BOP Settings**: Manually adjust or import LFM BOP data.
4. **Remote Deployment**:
   - Enable OpenSSH on the remote server (script [install_openssh.ps1](install_openssh.ps1) provided).
   - Configure SSH, ensure `acc-server.zip` is in the same directory, then deploy and run.

### 🛡️ Security Note
- **Warning**: Connection info is stored in plain text. Use manual entry if the server contains sensitive data.
- **General Use**: Saving passwords is generally safe for dedicated game servers.

---

## 🛠️ 技术栈 / Tech Stack

- **Frontend**: Vue 3 + TypeScript + Element Plus + Vite
- **Desktop**: Tauri (Rust-based)
- **Service**: Node.js + Express (SSH & File operations)

## 📂 项目结构 / Structure

```text
.
├── src/                 # Frontend source (Components, Services, Utils, Views, i18n)
├── src-tauri/           # Tauri desktop code (Rust)
├── cfg/                 # Config templates & examples
├── public/              # Static assets
└── id_reference.md      # ID lookup tables & CSV guide
```

## 更新日志  / Updatelog

### V2.0.2 - 2026/5/5
- 新增卡片/表格双视图切换，支持展开车手列表与健康检查筛选，批量排查异常更高效。
- 新增 Entrylist JSON 导入（高级）与导出入口，CSV 导入失败提示与成功摘要（队伍数/警告数/异常数）更清晰。
- 密码输入框新增显示/隐藏按钮，表格列宽与溢出表现优化，整体交互更稳定。

---

- Added a toggle for switching between Card and Table views, now supporting the expansion of the driver list and health check filtering to facilitate more efficient batch troubleshooting of anomalies.
- Added options for importing (Advanced) and exporting Entrylist JSON files; failure notifications and success summaries (displaying team count, warnings, and anomalies) for CSV imports are now clearer.
- Added a show/hide button to password input fields; table column widths and overflow handling have been optimized, resulting in a more stable overall user experience.

### V2.0.1 - 2026/4/28
- 新增 Tauri 一键部署能力，部署更简单。
- 修复赛事配置页“添加 Session”按钮缺失问题。
- 修复滑块异常，交互更稳定。
- 优化 SSH 连接与保活，远程操作更顺畅。
- 支持从服务器读取赛事配置。

---

- Added one-click deployment capability for Tauri, making deployment simpler.
- Fixed an issue where the "Add Session" button was missing on the event configuration page.
- Fixed slider anomalies, resulting in more stable interactions.
- Optimized SSH connections and keep-alive mechanisms for smoother remote operations.
- Added support for reading event configurations directly from the server.

### V2.0.0 - 2026/4/21
- **UI 全面升级**：从 Web 网页重构为 Tauri 桌面应用。

---

- **Complete UI overhaul**: Refactoring a Web Application into a Tauri Desktop App

### V1.1.1 - 2026/4/6
- 项目展示名由 ACC Server Manager 更名为 **ACC Pitwall**（本地包名 `acc-pitwall`），因与其他项目重名。

---

- Renamed the product from **ACC Server Manager** to **ACC Pitwall** (local package name `acc-pitwall`) due to a naming conflict with another project.

### V1.1.0 - 2026/4/4
- 在上传配置前加入弹窗二确认配置信息

---

- Add a confirmation modal to verify configuration details before uploading.

### V1.0.1 - 2026/3/31
- 修复 BOP 车辆滑块数值不正确 

---

- Fixed incorrect slider values ​​for BOP vehicles.

---

<div align="center">
Made with ❤️ for the ACC Community | [GitHub](https://github.com/hwangzhun/ACC-Server-Manager)
</div>
