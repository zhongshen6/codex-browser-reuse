# Codex Browser Reuse

在浏览器中运行固定版本的 Codex 官方 WebView，并通过本机 `codex app-server`
提供真实会话、模型、文件和工作区能力。官方前端文件保留在 `runtime/`，
浏览器兼容层通过 HTTP 响应注入，不直接改写官方资源文件。

本项目不是 Codex++ 用户脚本，也不需要官方 Codex App 同时运行。

## 静态资源传输

构建时先应用浏览器适配，再为固定的七个主要前端资源生成原文、gzip 和
Brotli 文件，存入 `runtime/frontend-build/`。范围为三个主要 JS、三个主要
CSS 和简体中文包。其他资源、桥接及插件脚本、聊天与 CLI 事件、文件预览和
下载不压缩。官方资源文件不变，现有浏览器 `Cache-Control` 策略不变。

后端每次启动时检查源文件大小、修改时间、相关适配代码、插件开关及根路径。
匹配则直接复用，缺失或不匹配则在开始监听前自动重新构建。无需前端版本号，
无需安装新依赖。构建失败会记录日志并使用当前未压缩资源。

修改相关代码后，也可立即手动重新构建：

```powershell
.\tools\build-frontend.ps1
```

HTTP 请求期间只读取已有产物，绝不重新压缩。运行中发现产物缺失或过期时
回退当前原文，手动构建完成后的新产物会自动被读取。修改后端代码仍需重启
后端。单纯重新压缩无需重启；正常启动、重启不改变有效产物的时间戳。
构建目录可删除，不入 Git，下一次启动会重新生成。移动整个项目无需修改
产物路径；若复制后文件信息改变，启动会重新生成。

## 快速开始

适用范围是普通 Windows 本机环境，不包含反向代理、HTTPS 终止、云服务器和
特殊网络拓扑。

前置条件：

- Windows 10 或更高版本，x64
- PowerShell
- 已安装并登录的 Codex CLI
- 现代浏览器，例如 Edge 或 Chrome

项目内置 Node.js `v24.21.0` 和 `smol-toml@1.9.0`，不需要安装系统 Node
或 npm，不需要联网下载依赖。源码和运行文件是同一份完整目录。
Git 不内置：使用系统 Git；没有安装时禁用 Git 相关功能，基本聊天仍可用。
安装系统 Git 后重启后端即可重新检测。

在项目目录执行：

```powershell
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

该脚本离线检查内置 Node 的版本、架构、SHA-256、运行依赖和许可证，
不会下载或安装软件。使用 `.\install.ps1 -Start` 可以在检查通过后直接启动。

启动、状态检查和测试统一使用 `runtime/node/node.exe`，不使用 Codex 自带
Node，也不依赖系统 Node。启动仅把内置 Node 加入当前进程及其子进程的
`PATH`，不会修改系统环境变量。缺失或损坏的依赖会明确报错，需恢复完整目录。

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

## 无项目会话

新建无项目会话遵循官方桌面端的目录分配逻辑，不使用本项目的程序目录：

```text
%USERPROFILE%\Documents\Codex\日期\会话目录\
  work\
  outputs\
```

会话的工作目录是会话目录本身，`outputs` 保存交付文件。某些官方入口不拆分
子目录。名称从首条消息中提取前六个英文或数字词，没有可用词时使用
`new-chat`；重名追加编号，同一天的并发新建也不会共用目录。

可以在官方前端的通用设置中更改“无项目任务文件夹”。目录选择窗口出现在
后端所在 Windows 设备，不是在远程浏览器设备。取消选择不会修改配置。
也可以在 `$CODEX_HOME/config.toml` 的已有 `[desktop]` 段配置：

```toml
[desktop]
projectlessWorkspaceRoot = 'D:\CodexTasks'
```

删除该项即可恢复默认值。修改配置只影响后续分配，不迁移已有会话目录。
无项目归属、工作区根目录提示和输出目录映射保存到官方的
`$CODEX_HOME/.codex-global-state.json`，刷新页面或重启后端后仍可读取。

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

- 根目录的入口 PowerShell 脚本、项目清单及 README。
- `src/` 的运行模块、`tools/` 的辅助工具、`tests/` 的测试、
  `docs/` 的说明及 `config/server.json` 配置模板。
- `extensions/` 下的插件、纳西妲主题脚本、CSS、SVG 和贴纸。
- `runtime/codex-frontend-26.917.9434/webview/` 的完整官方前端资源。
- `runtime/node/node.exe`、`runtime/node/LICENSE` 和 `runtime/dependencies.json`。
- `node_modules/smol-toml/` 的完整运行包和许可证。
- `package.json`、`package-lock.json`、`.gitignore` 和本 README。

不应提交：

- `config/lan-auth.json`
- `logs/`
- 任何 `*.log`
- 除 `node_modules/smol-toml/` 外的 npm 缓存和未声明依赖
- 官方前端导出目录内的 `node_modules/`
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
  README.md
  install.ps1
  start-backend.ps1
  stop-backend.ps1
  restart-backend.ps1
  status-backend.ps1
  src/
    server.js
    bridge.js
    extension-loader.js
    deployment.js
    desktop-*.js
    lan-auth.js / lan-login.css
    file-previews.js / renderer-*-adapter.js
    queued-follow-up-send-locks.js
    optional-git.js
  tools/
    bundled-runtime.ps1
    verify-dependencies.js
    windows-notifications.ps1
    focus-explorer.ps1
    bridge-stats.js
    create-preview-fixtures.js
    test.ps1
  docs/testing/
  extensions/
  runtime/codex-frontend-26.917.9434/webview/
  runtime/node/node.exe
  runtime/node/LICENSE
  runtime/dependencies.json
  node_modules/smol-toml/
  tests/
  config/server.json
  package.json
  package-lock.json
```

`src/` 是本项目的源码，`runtime/` 是固定官方前端和内置运行时，
`tools/` 是辅助脚本，`tests/` 是自动化测试，`docs/testing/` 保存测试报告。
`logs/` 保存运行期间产生的状态和诊断数据，不要在后端运行时删除 PID 文件。
账号、会话和工作区数据仍保存在本机 Codex 的目录中。

## 插件和主题

扩展配置在 `extensions/config.json`。修改后刷新浏览器即可：

```json
{
  "plugins": {
    "external-network-guard": true,
    "mobile-viewport": true,
    "attachment-controls": true,
    "sidebar-touch-scroll": true,
    "sidebar-performance": false,
    "disable-automations": true,
    "disable-agent-import": true,
    "browser-attachments": true,
    "file-previews": true,
    "right-panel": true,
    "backend-controls": true
  },
  "themes": {
    "nahida": false
  }
}
```

每个插件或主题都是 `extensions/plugins/<name>/` 或
`extensions/themes/<name>/` 下的独立包，至少包含 `manifest.json`，并可包含
`runtime.js`、`style.css`、图片和服务端资源转换器。`src/extension-loader.js`
负责发现包、读取开关、生成注入标签和校验资源路径；新增普通插件不需要修改
`server.js`。修改 `extensions/config.json` 后刷新浏览器即可。

纳西妲主题已经迁移到 `extensions/themes/nahida/`，但默认关闭。开启后刷新
页面；关闭后刷新页面即可回退。当前主题仍绑定这份固定官方前端，升级官方资源
后需要重新检查选择器和视觉效果。

`backend-controls` 在设置左侧“已归档的聊天”下面添加“重启后端”和“停止后端”，
沿用官方导航样式，并在操作前确认。两个操作作用于所有连接到该后端的设备，
可能中断运行中的任务。重启使用独立后台进程等待旧后端退出，再调用项目现有的
`start-backend.ps1`；当前页面恢复后自动刷新，局域网用户需要重新登录。
停止后只能在后端电脑上运行启动脚本恢复服务。重启结果写入
`logs/backend-control.log`。首次安装这项功能需要重启后端；之后可通过插件开关
关闭入口及对应接口。不修改官方前端资源，不接受浏览器传入的程序或命令。

附件控件、移动端视口、右侧栏策略、侧栏触摸和侧栏性能都已经作为独立包管理。
附件上传、文件预览、右侧栏内部状态和自动化查询的官方 bundle 适配仍保留在
`src/renderer-*-adapter.js` 和 `src/core-extension-adapters.js`，因为它们必须
在官方模块初始化前修改私有闭包，普通运行时插件无法可靠完成。它们是否启用
仍由对应功能开关控制。目录中的 `coreAdapter` 只是功能开关和包清单标记，
不代表把源码补丁伪装成运行时插件；实际适配顺序集中在
`src/core-extension-adapters.js`。

`sidebar-performance` 当前默认关闭，用于保留官方页面的原始性能基线。它只在
侧栏滚动期间暂停官方侧栏 CSS 动画，并关闭滚动期间不必要的视觉重绘；它不改
会话、文件或模型请求。需要启用对比时，把该值改为 `true` 后刷新浏览器。

`disable-automations` 默认开启。它在官方前端源头禁用 Scheduled、自动化和
收件箱入口，停止相关列表查询、轮询和本地调度器能力握手，并拒绝遗漏的自动化
宿主请求。它只作用于浏览器前端，不修改 Codex CLI 配置、会话历史中的工具声明
或模型可见工具。把该值改为 `false` 后刷新浏览器即可恢复官方自动化界面。

`disable-agent-import` 默认开启。它在官方查询源头禁用其他代理导入的检测、
历史和连接器查询，并拒绝遗漏的导入宿主请求。它不删除 Codex CLI 的工具，
也不影响普通会话、项目和文件能力；关闭开关并刷新页面才会恢复官方导入入口。

`wsl-bash-availability` 和 `third-party-notices` 已按官方桌面宿主协议适配。
前者检测本机 WSL 默认发行版和 Bash，后者读取随项目发布的声明文件。若能力
不存在，返回官方的不可用或缺失形态，不伪造可用数据。

`external-network-guard` 默认开启。它要求浏览器前端通过本项目桥接层访问
模型、CLI、文件和宿主能力，阻止跨源 `fetch`、XHR、WebSocket、EventSource
和 `sendBeacon`，并通过页面 CSP 阻止外部脚本、样式、框架、Worker 及网络连接。
它同时关闭 Service Worker 注册，避免 Worker 使用独立的 `fetch` 绕过桥接层；
Windows 通知由后端通知器负责，不依赖页面 Service Worker。
同源桥接、`data:` 和 `blob:` 资源仍可用；用户主动点击链接打开外部浏览器不由
这个插件拦截。当前检查未发现页面实际请求 `chatgpt.com`、`chat.openai.com`
或其他 OpenAI 官方资源，但该插件用于防止未来的绕过访问。拦截事件只记录来源
origin 和通道类型，不保存 URL 路径、请求体或聊天内容。

## 测试

```powershell
.\tools\test.ps1
```

从任意目录调用这个测试脚本均可，不依赖当前工作目录。
统计工具和可重新生成的预览测试文件也放在 `tools/`：

```powershell
.\runtime\node\node.exe .\tools\bridge-stats.js
.\runtime\node\node.exe .\tools\create-preview-fixtures.js
```

当前自动化测试覆盖路径重写、CSRF、登录鉴权、设置、通知、移动视口、窄屏
侧栏策略、项目路径和请求锁。它们不替代真实浏览器中的模型交互测试。

内置依赖的来源、固定版本及校验值记录在 `runtime/dependencies.json`。
升级时需同时更新运行文件、许可证、清单及锁文件，并使用内置 Node 跑测试。
Node 和依赖随源码一起提交到 Git；不要删除它们或省略它们再交付项目。

## 当前边界

本项目尽量把模型、会话、配置、文件和工作区请求转发给本机 Codex CLI。
浏览器兼容层仍负责文件选择、资源管理器、Windows 通知、浏览器路径和
Electron 宿主替代。

`browser_use` 和 `in_app_browser` 在本构建中关闭。项目不提供内置浏览器环境。

未适配的宿主 `fetch` 请求返回 501，错误码为 `BRIDGE_UNSUPPORTED_REQUEST`；
未知 CLI RPC 返回 JSON-RPC `-32601`。未实现的自动化、收件箱、自定义代理等
列表也返回不支持，不用空列表表示查询成功。这些响应会进入桥接错误统计。
已实现接口的合法空结果、真实 CLI 错误和主动关闭的能力状态保持原样。
启动所需的宿主兼容数据仍保留；不支持响应并不意味着缺失功能已经实现。

桥接统计还提供 `adaptations` 适配清单和脱敏错误日志。`app/list` 仍由 CLI
转发，失败会记录上游错误码、有限长度消息、耗时和关联 ID，不会改写成空列表。
错误日志位于 `logs/bridge-request-errors.jsonl`，不要公开其中内容。

## 工具注册日志

后端在 `logs/tool-registrations.jsonl` 记录客户端动态工具注册，不改变注册行为。
新增日志代码后需重启后端；记录从重启之后开始，不能补回此前的请求。
每次新建或恢复会话，以及任何携带 `dynamicTools` 的 RPC，都会产生关联记录：

- `received`：桥接层收到的工具声明；`source: browser-rpc` 表示来自浏览器前端。
- `cli-submitted`：桥接适配后实际写入 CLI 通信管道的工具声明。
- `cli-response`：CLI 对该请求返回成功或错误，以及成功后得到的会话 ID。
- `bridge-failure`：初始化失败、写入失败或请求超时。

使用 `traceId` 关联同一次请求，查看 `dynamicTools.state` 区分 `absent`、
`null`、`empty`、`provided` 和 `invalid`。`provided` 时保留工具名称、命名空间、
描述、参数 schema、延迟加载标记及声明字段名，不保存聊天正文或完整配置。
工具定义本身若包含敏感内容，也会进入日志，因此不要直接公开这些文件。

```powershell
Get-Content .\logs\tool-registrations.jsonl -Tail 12
```

单个日志超过 10 MiB 时轮换到 `tool-registrations.jsonl.1`，只保留一份历史段。
CLI 接受请求不等于已经验证模型最终可见的工具列表；恢复会话时字段缺失也不
证明旧动态工具被清除。此日志不包含通过配置独立加载的 MCP 工具清单。

## 文件预览支持

文件预览继续使用官方 WebView 的渲染器，桥接层只提供受限的本地文件读取：

- 已验证：DOCX、XLSX、PPTX、PDF、CSV、TSV、图片、SVG、WAV、MP4。
- 已验证源码预览：Markdown、C 等代码文件，以及 HTML 源码。
- 已验证 Notebook：`.ipynb` 以只读 Notebook 面板显示单元格和已有输出。
- 音频和视频通过浏览器原生媒体元素加载，文件接口支持 HTTP Range，
  因此拖动进度不会每次都重新读取整个文件。
- HTML 默认只显示源码，不执行本地 HTML，避免把工作区文件当成可执行网页。
- LaTeX 只有在本机存在 `pdflatex` 或其他兼容编译器，并且另行实现
  `compile-latex-artifact` 桥接后，才能生成 PDF；当前版本显示其源码。
- 旧版 `.doc`、`.xls`、`.ppt`、ODF 和压缩包没有纳入官方浏览器渲染器，
  可下载或用系统应用打开，但不宣称有内置预览。

预览读取默认限制为 40 MiB，下载不受该预览限制影响。文件路径仍必须位于
配置的可信根目录内。
