# Codex Browser Reuse

在浏览器中运行固定版本的 Codex 官方 WebView，并通过本机 `codex app-server`
提供真实会话、模型、文件和工作区能力。官方前端文件保留在 `runtime/`，
浏览器兼容层通过 HTTP 响应注入，不直接改写官方资源文件。

本项目不是 Codex++ 用户脚本，也不需要官方 Codex App 同时运行。

## 快速开始

适用范围是普通 Windows 本机环境，不包含反向代理、HTTPS 终止、云服务器和
特殊网络拓扑。

前置条件：

- Windows 10 或更高版本
- PowerShell
- Node.js 18 或更高版本
- npm
- 已安装并登录的 Codex CLI

在项目目录执行：

```powershell
npm ci
.\start-backend.ps1
```

浏览器打开：

```text
http://127.0.0.1:4387/codex/
```

首次从局域网设备访问时，打开：

```text
http://本机局域网IP:4387/codex/
```

后端会显示登录页，并在首次启动时生成
`config/lan-auth.json`。这个文件只保存在本机，不要上传或发送给别人。

启动脚本会同时确认：

1. HTTP 后端已经监听。
2. Codex App Server 已经初始化并处于 `running`。

检查状态：

```powershell
.\status-backend.ps1
```

停止：

```powershell
.\stop-backend.ps1
```

重启：

```powershell
.\restart-backend.ps1
```

如果 PowerShell 执行策略阻止脚本：

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\start-backend.ps1
```

首次安装也可以执行：

```powershell
.\install.ps1
```

该脚本按提交的锁文件运行 `npm ci`。安装完成后再运行启动脚本；
使用 `.\install.ps1 -Start` 可以在安装成功后直接启动。

## Codex CLI 查找

启动顺序如下：

1. 使用 `CODEX_BIN`。
2. 在 Windows AppX 中查找最新的 `OpenAI.Codex*` 安装。
3. 在 `PATH` 中查找 `codex.exe`。

如果安装位置不是标准位置，手动设置：

```powershell
$env:CODEX_BIN = 'D:\Tools\Codex\codex.exe'
.\start-backend.ps1
```

Codex 的账号、登录状态、配置和会话仍由本机的 `CODEX_HOME` 管理，默认是
`%USERPROFILE%\.codex`。项目不会复制这些数据。

## 端口和路径

默认监听 `0.0.0.0:4387`，默认浏览器根路径是 `/codex/`。

修改端口：

```powershell
.\start-backend.ps1 -Port 4388
```

修改根路径：编辑 `config/server.json`：

```json
{
  "basePath": "/codex/"
}
```

根路径必须是 `/` 或类似 `/codex/` 的 URL 路径。修改后重新启动后端。

普通局域网使用需要在 Windows 防火墙中允许可信私有网络访问端口
`4387`。不要把这个服务直接暴露到公网。

## Git 发布范围

应提交：

- 根目录的 JavaScript、PowerShell、配置模板和测试。
- `extensions/` 下的插件、纳西妲主题脚本、CSS、SVG 和贴纸。
- `runtime/codex-frontend-26.917.9434/webview/` 的完整官方前端资源。
- `package.json`、`package-lock.json`、`.gitignore` 和本 README。

不应提交：

- `config/lan-auth.json`
- `logs/`
- 任何 `*.log`
- 根目录或官方运行时中的 `node_modules/`
- `runtime/.../.vite/`
- `runtime/.../package.json`
- `runtime/.../native-menu-locales/`
- Codex 登录数据、令牌、会话历史和真实工作区
- 临时截图和浏览器缓存

官方 `webview` 是运行所需的固定资源，不是缓存。官方运行时中的 Electron
构建目录、原始依赖和工程元数据不参与本项目启动。

## 目录结构

```text
codex-browser-reuse/
  server.js
  bridge.js
  deployment.js
  browser-*.js / browser-*.css
  desktop-*.js
  lan-auth.js / lan-login.css
  install.ps1
  start-backend.ps1
  stop-backend.ps1
  restart-backend.ps1
  status-backend.ps1
  extensions/
  runtime/codex-frontend-26.917.9434/webview/
  tests/
  config/server.json
  package.json
  package-lock.json
```

## 插件和主题

扩展配置在 `extensions/config.json`。修改后刷新浏览器即可：

```json
{
  "plugins": {
    "sidebar-touch-scroll": true,
    "sidebar-performance": true
  },
  "themes": {
    "nahida": false
  }
}
```

纳西妲主题已经迁移到 `extensions/themes/nahida/`，但默认关闭。开启后刷新
页面；关闭后刷新页面即可回退。当前主题仍绑定这份固定官方前端，升级官方资源
后需要重新检查选择器和视觉效果。

`sidebar-performance` 默认开启。它只在侧栏滚动期间暂停官方侧栏 CSS 动画，
并关闭滚动期间不必要的视觉重绘；它不改会话、文件或模型请求。若需要对比
官方原始表现，把该值改为 `false` 后刷新浏览器。

## 测试

```powershell
npm test
```

当前自动化测试覆盖路径重写、CSRF、登录鉴权、设置、通知、移动视口、窄屏
侧栏策略、项目路径和请求锁。它们不替代真实浏览器中的模型交互测试。

## 当前边界

本项目尽量把模型、会话、配置、文件和工作区请求转发给本机 Codex CLI。
浏览器兼容层仍负责文件选择、资源管理器、Windows 通知、浏览器路径和
Electron 宿主替代。

`browser_use` 和 `in_app_browser` 在本构建中关闭。项目不提供内置浏览器环境。
