(() => {
  const paths = window.__codexBrowserPaths;
  const nativeFetch = window.fetch.bind(window);
  const toPublicRequest = input => {
    const raw = input instanceof URL ? input.href : typeof input === "string" ? input : input.url;
    const target = new URL(raw, location.href);
    // Preserve external fetch inputs and Request options exactly as provided.
    if (target.origin !== location.origin) return input;
    if (target.origin === location.origin && paths.basePath !== "/" &&
        /^\/(?:__bridge|__extensions|assets|apps|images|fonts)\//.test(target.pathname)) {
      target.pathname = paths.publicPath(target.pathname);
    }
    return input instanceof Request ? new Request(target.href, input) : target.href;
  };
  // Only our mounted backend receives the session's CSRF token, never external URLs.
  const fetch = (input, options = {}) => {
    const request = toPublicRequest(input);
    const target = new URL(request instanceof URL ? request.href :
      typeof request === "string" ? request : request.url, location.href);
    // A disabled frontend API must also stay local if an official module uses
    // fetch directly instead of going through electronBridge's host envelope.
    const policy = window.__codexBrowserExtensionPolicy?.beforeFetchRequest?.(target);
    if (policy?.blocked) {
      return Promise.resolve(new Response(JSON.stringify({
        error: "该前端功能已由扩展禁用", code: "FRONTEND_EXTENSION_DISABLED"
      }), { status: 410, headers: { "content-type": "application/json" } }));
    }
    const method = String(options.method || input?.method || "GET").toUpperCase();
    if (target.origin === location.origin &&
        target.pathname.startsWith(paths.publicPath("/__bridge/")) &&
        !["GET", "HEAD", "OPTIONS"].includes(method)) {
      const headers = new Headers(options.headers || (request instanceof Request ? request.headers : undefined));
      headers.set("x-codex-csrf", window.__codexBrowserCsrfToken || "");
      options = { ...options, headers };
    }
    return nativeFetch(request, options);
  };
  // One transport owns both bridge and official renderer requests, without recursion.
  window.fetch = fetch;
  // LAN HTTP is not a secure browser context. getRandomValues remains available
  // there, but randomUUID does not; the bundled renderer also calls randomUUID.
  if (typeof crypto.randomUUID !== "function") {
    crypto.randomUUID = () => {
      const bytes = crypto.getRandomValues(new Uint8Array(16));
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      bytes[8] = (bytes[8] & 0x3f) | 0x80;
      const hex = [...bytes].map(byte => byte.toString(16).padStart(2, "0")).join("");
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    };
  }

  window.__codexBrowserBridgeFeatures = {
    requestOutcome: true,
    officialContextMenus: true,
    forwardDeleteAndAttachments: true,
    sidebarTouchScrollPolicy: Boolean(window.__codexBrowserSidebarTouchPolicy)
  };
  const seen = [];
  window.__codexBrowserBridgeEvents = seen;
  window.__codexBrowserErrors = [];
  const telemetryQueue = [];
  const telemetryCounts = new Map();
  const pendingTelemetry = new Map();
  let telemetrySequence = 0;
  const telemetrySafePath = (value) => {
    try {
      return new URL(String(value || ""), location.href).pathname || "/";
    } catch {
      return String(value || "").split("?")[0].slice(0, 180);
    }
  };
  const queueBridgeTelemetry = (entry) => {
    const safe = {
      at: Date.now(),
      kind: String(entry.kind || "unknown"),
      key: String(entry.key || "(unknown)").slice(0, 180),
      category: String(entry.category || "unhandled"),
      outcome: String(entry.outcome || "success"),
      status: Number.isInteger(entry.status) ? entry.status : undefined,
      // Summaries are bounded and redacted before they leave the browser.
      traceId: window.__codexBridgeDiagnostics?.traceId(entry.traceId),
      durationMs: Number.isFinite(entry.durationMs) ? Math.max(0, Math.round(entry.durationMs)) : undefined,
      error: window.__codexBridgeDiagnostics?.summarize(entry.error),
      empty: Boolean(entry.empty || entry.category === "empty-fallback"),
      fields: Array.isArray(entry.fields)
        ? entry.fields.slice(0, 32).map(value => String(value).slice(0, 80))
        : undefined
    };
    telemetryQueue.push(safe);
    const countKey = `${safe.category}\u0000${safe.kind}\u0000${safe.key}`;
    const current = telemetryCounts.get(countKey) || {
      category: safe.category, kind: safe.kind, key: safe.key,
      count: 0, errors: 0, empty: 0, lastAt: 0
    };
    current.count += 1;
    current.errors += safe.outcome === "error" ? 1 : 0;
    current.empty += safe.empty ? 1 : 0;
    current.lastAt = safe.at;
    telemetryCounts.set(countKey, current);
    if (telemetryQueue.length > 500) telemetryQueue.splice(0, telemetryQueue.length - 500);
  };
  const telemetryRequestKey = (kind, id) => `${kind}:${String(id)}`;
  const trackBridgeRequest = (kind, id, entry) => {
    entry = { ...entry, traceId: `browser-${Date.now()}-${++telemetrySequence}`, startedAt: Date.now() };
    if (id != null) pendingTelemetry.set(telemetryRequestKey(kind, id), entry);
    queueBridgeTelemetry({ ...entry, outcome: "received" });
  };
  const finishBridgeRequest = (kind, id, outcome, status, error) => {
    const key = telemetryRequestKey(kind, id);
    const entry = pendingTelemetry.get(key);
    if (!entry) return;
    pendingTelemetry.delete(key);
    queueBridgeTelemetry({ ...entry, outcome, status, error,
      durationMs: Date.now() - entry.startedAt, fields: undefined });
  };
  const bridgeTraceHeaders = (kind, id) => ({
    "content-type": "application/json",
    "x-codex-trace": pendingTelemetry.get(telemetryRequestKey(kind, id))?.traceId || ""
  });
  const flushBridgeTelemetry = async () => {
    if (!telemetryQueue.length) return;
    const batch = telemetryQueue.splice(0, 100);
    try {
      const response = await fetch("/__bridge/telemetry", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ events: batch })
      });
      if (!response.ok) telemetryQueue.unshift(...batch);
    } catch {
      telemetryQueue.unshift(...batch);
    }
  };
  // Runtime extensions report blocked declarative or non-fetch channels here.
  // Only the origin and channel are retained; paths and payloads are excluded.
  window.addEventListener("codex-external-network-blocked", event => {
    const detail = event.detail || {};
    queueBridgeTelemetry({
      kind: "external-network-blocked",
      key: String(detail.channel || "unknown"),
      category: "extension-policy",
      outcome: "error",
      status: 410,
      fields: [detail.origin, detail.channel].filter(Boolean)
    });
  });
  setInterval(flushBridgeTelemetry, 750);
  window.__codexBridgeStats = { queue: telemetryQueue, counts: telemetryCounts, flush: flushBridgeTelemetry };
  const configuredProjects = Array.isArray(window.__codexBrowserProjects)
    ? window.__codexBrowserProjects
    : [];
  // Only the backend knows filesystem locations; never invent a machine-specific
  // demo directory when bootstrap data is missing after deployment or relocation.
  const demoRoot = window.__codexBrowserWorkspaceRoot;
  const codexHomeRoot = window.__codexBrowserCodexHome;
  let projectlessWorkspaceRoot = window.__codexBrowserProjectlessWorkspaceRoot;
  if (typeof demoRoot !== "string" || !demoRoot ||
      typeof codexHomeRoot !== "string" || !codexHomeRoot ||
      typeof projectlessWorkspaceRoot !== "string" || !projectlessWorkspaceRoot) {
    throw new Error("Backend filesystem bootstrap is missing");
  }
  const desktopSettings = { ...(window.__codexBrowserDesktopSettings || {}) };
  // An empty real project catalog stays empty; never fabricate a program project.
  const projects = configuredProjects;
  const projectState = Object.fromEntries(projects.map(project => [project.id, project]));
  const selectedProject = window.__codexBrowserSelectedProject &&
    projectState[window.__codexBrowserSelectedProject.projectId]
    ? window.__codexBrowserSelectedProject
    : null;
  const injectedAssignments = window.__codexBrowserThreadAssignments &&
    typeof window.__codexBrowserThreadAssignments === "object"
    ? window.__codexBrowserThreadAssignments
    : {};
  const injectedProjectlessThreadIds = Array.isArray(window.__codexBrowserProjectlessThreadIds)
    ? window.__codexBrowserProjectlessThreadIds
    : [];
  const sidebarProjectThreadOrders = window.__codexBrowserSidebarProjectThreadOrders &&
    typeof window.__codexBrowserSidebarProjectThreadOrders === "object"
    ? window.__codexBrowserSidebarProjectThreadOrders
    : {};
  const globalState = new Map([
    ["local-projects", projectState],
    ["selected-project", selectedProject],
    ["thread-project-assignments", injectedAssignments],
    ["projectless-thread-ids", injectedProjectlessThreadIds],
    ["thread-workspace-root-hints", window.__codexBrowserThreadPaths?.threadWorkspaceRootHints || {}],
    ["thread-projectless-output-directories", window.__codexBrowserThreadPaths?.threadProjectlessOutputDirectories || {}],
    ["project-order", window.__codexBrowserProjectOrder || projects.map(project => project.id)],
    ["sidebar-project-thread-orders", sidebarProjectThreadOrders]
  ]);
  const authoritativeGlobalStateKeys = new Set([
    "local-projects",
    "selected-project",
    "thread-project-assignments",
    "projectless-thread-ids",
    "thread-workspace-root-hints",
    "thread-projectless-output-directories",
    "project-order",
    "sidebar-project-thread-orders"
  ]);
  const browserGlobalStateStorageKey = "codex-browser-global-state";
  const persistedAtomStorageKey = "codex-browser-persisted-atoms";
  let persistedAtoms = {};
  try {
    const stored = JSON.parse(localStorage.getItem(persistedAtomStorageKey) || "{}");
    if (stored && typeof stored === "object" && !Array.isArray(stored)) {
      persistedAtoms = stored;
    }
  } catch {}
  const savePersistedAtoms = () => {
    localStorage.setItem(persistedAtomStorageKey, JSON.stringify(persistedAtoms));
  };
  const unreadThreadStateKey = "unread-thread-ids-by-host-v1";
  // Keep the same host-to-thread-list shape as the official renderer so an
  // already unread conversation remains unread across browser reloads.
  let unreadThreadIdsByHost = {};
  if (persistedAtoms[unreadThreadStateKey] &&
      typeof persistedAtoms[unreadThreadStateKey] === "object" &&
      !Array.isArray(persistedAtoms[unreadThreadStateKey])) {
    unreadThreadIdsByHost = Object.fromEntries(
      Object.entries(persistedAtoms[unreadThreadStateKey]).map(([hostId, ids]) => [
        hostId,
        Array.isArray(ids) ? ids.filter(id => typeof id === "string") : []
      ])
    );
  }
  const saveUnreadThreadState = () => {
    persistedAtoms[unreadThreadStateKey] = unreadThreadIdsByHost;
    savePersistedAtoms();
  };
  const setThreadUnread = (hostId, threadId, hasUnreadTurn) => {
    if (!threadId) return false;
    const key = typeof hostId === "string" && hostId ? hostId : "local";
    const current = unreadThreadIdsByHost[key] || [];
    const next = hasUnreadTurn
      ? [...new Set([...current, threadId])]
      : current.filter(id => id !== threadId);
    if (next.length === current.length && next.every((id, index) => id === current[index])) {
      return false;
    }
    unreadThreadIdsByHost = { ...unreadThreadIdsByHost, [key]: next };
    saveUnreadThreadState();
    return true;
  };
  const clearThreadUnread = (hostId, threadId) => {
    if (!setThreadUnread(hostId, threadId, false)) return;
    // The renderer subscribes to this notification to update the visible
    // sidebar immediately, while the persisted atom handles later reloads.
    notify("thread-read-state-changed", {
      hostId: hostId || "local",
      conversationId: threadId,
      hasUnreadTurn: false
    });
  };
  try {
    const persisted = JSON.parse(localStorage.getItem(browserGlobalStateStorageKey) || "{}");
    for (const [key, value] of Object.entries(persisted)) {
      if (!authoritativeGlobalStateKeys.has(key)) globalState.set(key, value);
    }
  } catch {}
  const persistBrowserGlobalState = () => {
    const persisted = {};
    for (const [key, value] of globalState) {
      if (!authoritativeGlobalStateKeys.has(key)) persisted[key] = value;
    }
    localStorage.setItem(browserGlobalStateStorageKey, JSON.stringify(persisted));
  };
  const appearanceStorageKey = "codex-browser-appearance-settings";
  let browserAppearance = {};
  try {
    browserAppearance = JSON.parse(localStorage.getItem(appearanceStorageKey) || "{}");
  } catch {}
  const systemDarkTheme = matchMedia("(prefers-color-scheme: dark)");
  const applyBrowserAppearance = () => {
    const root = document.documentElement;
    const uiSize = Number(browserAppearance.uiFontSize ?? desktopSettings.sansFontSize);
    const chatSize = Number(browserAppearance.chatFontSize);
    const codeSize = Number(browserAppearance.codeFontSize ?? desktopSettings.codeFontSize);
    let style = document.getElementById("codex-browser-appearance-overrides");
    if (!style) {
      style = document.createElement("style");
      style.id = "codex-browser-appearance-overrides";
      document.head.appendChild(style);
    }
    style.textContent = [
      Number.isFinite(uiSize) && uiSize >= 10 && uiSize <= 24
        ? `:root { --font-ui-size: ${uiSize}px !important; }`
        : "",
      Number.isFinite(chatSize) && chatSize >= 10 && chatSize <= 32
        ? `:root { --codex-chat-font-size-override: ${chatSize}px !important; }`
        : "",
      Number.isFinite(codeSize) && codeSize >= 9 && codeSize <= 32
        ? `:root { --font-code-size: ${codeSize}px !important; --codex-chat-code-font-size-override: ${codeSize}px !important; }`
        : ""
    ].filter(Boolean).join("\n");
    if (Number.isFinite(uiSize) && uiSize >= 10 && uiSize <= 24) {
      root.style.setProperty("--font-ui-size", `${uiSize}px`);
    }
    if (Number.isFinite(chatSize) && chatSize >= 10 && chatSize <= 32) {
      root.style.setProperty("--codex-chat-font-size-override", `${chatSize}px`);
    }
    if (Number.isFinite(codeSize) && codeSize >= 9 && codeSize <= 32) {
      root.style.setProperty("--font-code-size", `${codeSize}px`);
      root.style.setProperty("--codex-chat-code-font-size-override", `${codeSize}px`);
    }
    const theme = desktopSettings.appearanceTheme;
    // Packaged CSS needs a concrete theme to select one lightningcss color branch.
    root.dataset.theme = theme === "light" || theme === "dark"
      ? theme
      : systemDarkTheme.matches ? "dark" : "light";
    if (desktopSettings["reduced-motion-preference"] === "on") {
      root.dataset.reducedMotion = "true";
    } else {
      delete root.dataset.reducedMotion;
    }
  };
  systemDarkTheme.addEventListener("change", () => {
    if (desktopSettings.appearanceTheme === "system") applyBrowserAppearance();
  });
  let browserContextMenu = null;
  let browserContextMenuPoint = { x: 12, y: 12 };
  // Keep the native-menu anchor point; the official renderer supplies the menu items and actions.
  document.addEventListener("contextmenu", (event) => {
    browserContextMenuPoint = { x: event.clientX, y: event.clientY };
  }, true);
  const closeBrowserContextMenu = () => {
    browserContextMenu?.remove();
    browserContextMenu = null;
  };
  const showBrowserContextMenu = (items) => new Promise(resolve => {
    closeBrowserContextMenu();
    // Keep the renderer's file actions; expose its saveCopy action with an
    // explicit browser-download label as well as the original Save As label.
    const menuItems = [];
    for (const item of items || []) {
      menuItems.push(item);
      if (item.id === "workspace-file-save-as") {
        menuItems.push({ ...item, label: "下载" });
      }
    }
    queueBridgeTelemetry({ kind: "ui-action", key: "context-menu", category: "local-bridge",
      outcome: "received", fields: menuItems.filter(item => item.id).map(item => item.id) });
    const root = document.createElement("div");
    root.dataset.browserReuseContextMenu = "true";
    root.setAttribute("role", "menu");
    root.style.cssText = [
      "position:fixed", "z-index:2147483647", "min-width:196px",
      "max-width:360px", "padding:5px", "border:1px solid var(--color-border, #d9d9d9)",
      "border-radius:10px", "background:var(--color-surface, #fff)",
      "box-shadow:0 12px 32px rgba(0,0,0,.18)", "font:13px/18px system-ui,sans-serif",
      "color:var(--color-text, #222)"
    ].join(";");
    const finish = (item) => {
      closeBrowserContextMenu();
      queueBridgeTelemetry({ kind: "ui-action", key: `context-menu:${item?.id || "dismiss"}`,
        category: "local-bridge", outcome: "success" });
      resolve(item ? { id: item.id } : {});
    };
    const renderItems = (list, parent, level = 0) => {
      for (const item of list || []) {
        if (item.type === "separator") {
          const separator = document.createElement("div");
          separator.style.cssText = "height:1px;margin:5px 4px;background:var(--color-border,#e5e5e5)";
          parent.appendChild(separator);
          continue;
        }
        const row = document.createElement("div");
        row.setAttribute("role", "menuitem");
        row.tabIndex = -1;
        row.textContent = `${item.checked ? "✓ " : ""}${item.label || item.id || ""}`;
        row.style.cssText = [
          "position:relative", "display:flex", "align-items:center", "min-height:30px",
          "padding:5px 10px", "border-radius:6px", "white-space:nowrap",
          "cursor:" + (item.enabled === false ? "default" : "pointer"),
          "opacity:" + (item.enabled === false ? ".45" : "1")
        ].join(";");
        if (item.submenu?.length) {
          row.textContent += "  ›";
          const submenu = document.createElement("div");
          submenu.setAttribute("role", "menu");
          submenu.style.cssText = [
            "display:none", "position:absolute", "left:calc(100% - 4px)", "top:-5px",
            "min-width:196px", "padding:5px", "border:1px solid var(--color-border,#d9d9d9)",
            "border-radius:10px", "background:var(--color-surface,#fff)",
            "box-shadow:0 12px 32px rgba(0,0,0,.18)"
          ].join(";");
          renderItems(item.submenu, submenu, level + 1);
          row.appendChild(submenu);
          row.addEventListener("mouseenter", () => { submenu.style.display = "block"; });
          row.addEventListener("mouseleave", () => { submenu.style.display = "none"; });
        }
        row.addEventListener("mouseenter", () => {
          if (item.enabled !== false) row.style.background = "var(--color-background-primary-ghost-hover,#f1f1f1)";
        });
        row.addEventListener("mouseleave", () => { row.style.background = ""; });
        row.addEventListener("click", event => {
          event.stopPropagation();
          if (item.enabled !== false && !item.submenu?.length) finish(item);
        });
        parent.appendChild(row);
      }
    };
    renderItems(menuItems, root);
    document.body.appendChild(root);
    browserContextMenu = root;
    const rect = root.getBoundingClientRect();
    root.style.left = `${Math.max(4, Math.min(browserContextMenuPoint.x, innerWidth - rect.width - 4))}px`;
    root.style.top = `${Math.max(4, Math.min(browserContextMenuPoint.y, innerHeight - rect.height - 4))}px`;
    const dismiss = event => {
      if (!root.contains(event.target)) {
        document.removeEventListener("pointerdown", dismiss, true);
        finish(null);
      }
    };
    setTimeout(() => document.addEventListener("pointerdown", dismiss, true), 0);
    root.addEventListener("keydown", event => {
      if (event.key === "Escape") finish(null);
    });
  });
  // Only native browser formats belong to external Open In targets. Office
  // files use the official artifact panel rather than downloading a raw ZIP.
  const browserRenderableExtensions = new Set([
    "html", "htm", "pdf", "svg", "png", "jpg", "jpeg", "gif", "bmp", "avif", "ico", "webp",
    "txt", "md", "csv", "tsv", "json", "ipynb", "xml", "yaml", "yml", "toml", "log", "tex",
    "c", "h", "cpp", "hpp", "rs", "py", "java", "go", "js", "mjs", "ts", "tsx", "jsx", "sh", "ps1",
    "aac", "flac", "m4a", "mp3", "mp4a", "oga", "ogg", "opus", "wav", "mp4", "webm", "ogv"
  ]);
  const isBrowserRenderableFile = (filePath) => {
    const extension = String(filePath || "")
      .split(/[?#]/, 1)[0]
      .split(".")
      .pop()
      ?.toLowerCase();
    return browserRenderableExtensions.has(extension);
  };
  const openFileManager = async (filePath) => {
    const response = await fetch("/__bridge/open-file-manager", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ path: filePath })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.success !== true) {
      throw new Error(result.error || "file manager open failed");
    }
    queueBridgeTelemetry({ kind: "ui-action", key: "open-file-manager",
      category: "local-bridge", outcome: "submitted" });
    return true;
  };
  const downloadWorkspaceFile = async (filePath) => {
    if (typeof filePath !== "string" || !filePath) {
      throw new Error("download path is required");
    }
    // The server resolves the file within the allowed workspace roots and
    // responds with Content-Disposition: attachment for the browser to save.
    const link = document.createElement("a");
    link.href = paths.publicPath(`/__bridge/local-file?download=1&path=${encodeURIComponent(filePath)}`);
    link.download = filePath.replaceAll("\\", "/").split("/").pop().replace(/:\d+$/, "");
    link.hidden = true;
    document.body.append(link);
    link.click();
    link.remove();
    queueBridgeTelemetry({ kind: "ui-action", key: "download-workspace-file",
      category: "local-bridge", outcome: "submitted" });
    return true;
  };
  applyBrowserAppearance();
  requestAnimationFrame(() => applyBrowserAppearance());
  setTimeout(() => applyBrowserAppearance(), 250);
  setTimeout(() => applyBrowserAppearance(), 1000);
  const saveBrowserAppearance = () => {
    localStorage.setItem(appearanceStorageKey, JSON.stringify(browserAppearance));
    applyBrowserAppearance();
  };
  let threadAssignments = { ...injectedAssignments };
  let projectlessThreadIds = new Set(injectedProjectlessThreadIds);
  const threadProjectStateKeys = {
    threadAssignments: "thread-project-assignments",
    projectlessThreadIds: "projectless-thread-ids",
    threadWorkspaceRootHints: "thread-workspace-root-hints",
    threadProjectlessOutputDirectories: "thread-projectless-output-directories"
  };
  const applyThreadProjectState = (state, changed = false) => {
    threadAssignments = { ...state.threadAssignments };
    projectlessThreadIds = new Set(state.projectlessThreadIds || []);
    for (const [name, key] of Object.entries(threadProjectStateKeys)) {
      globalState.set(key, state[name]);
    }
    if (changed) reply({ type: "global-state-updated", keys: Object.values(threadProjectStateKeys) });
  };
  const threadProjectStateRequest = async payload => {
    // Backend state is authoritative across refreshes, devices and restarts.
    const response = await fetch("/__bridge/thread-project-state", {
      method: payload ? "POST" : "GET", cache: "no-store",
      headers: { "content-type": "application/json" },
      ...(payload ? { body: JSON.stringify(payload) } : {})
    });
    const state = await response.json();
    if (!response.ok) throw new Error(state.error || "Thread membership save failed");
    applyThreadProjectState(state, Boolean(payload));
    return state;
  };
  const assignmentForProject = (projectId) => projectId == null
    ? null
    : { projectKind: "local", projectId };
  const recordThreadProject = (thread) => {
    if (!thread?.id || projectlessThreadIds.has(thread.id)) return;
    const projectId = thread.projectId ||
      threadAssignments[thread.id]?.projectId;
    if (!projectId || !projectState[projectId]) return;
    threadAssignments[thread.id] = assignmentForProject(projectId);
    // Response metadata may populate the current view, but only the official
    // membership service is allowed to persist a change of project ownership.
    globalState.set("thread-project-assignments", threadAssignments);
  };
  const recordThreadProjects = (threads) => {
    for (const thread of threads || []) recordThreadProject(thread);
  };
  const workerListeners = new Map();
  const terminalHostListeners = new Set();
  const pendingMcpRequests = new Map();
  const reply = (message) => {
    if (message?.type === "mcp-response") {
      finishBridgeRequest(
        "mcp-request", message.message?.id,
        message.message?.error ? "error" : "success", undefined, message.message?.error
      );
      const pending = pendingMcpRequests.get(String(message.message?.id));
      if (pending) {
        pendingMcpRequests.delete(String(message.message?.id));
        if (!message.message?.error &&
            (pending.method === "thread/read" || pending.method === "thread/resume")) {
          clearThreadUnread(pending.hostId, pending.params.threadId);
        }
      }
    } else if (message?.type === "fetch-response") {
      let error;
      if (message.responseType === "error" || message.status >= 400) {
        try { error = JSON.parse(message.bodyJsonString); }
        catch { error = { message: "Host response failed without a JSON error" }; }
      }
      finishBridgeRequest(
        "fetch", message.requestId,
        message.responseType === "error" || message.status >= 400 ? "error" : "success",
        message.status, error
      );
    }
    window.postMessage(message, window.location.origin);
  };
  const notificationClientId = crypto.randomUUID();
  const reportWindowFocus = (closed = false) => {
    const focused = document.hasFocus() && document.visibilityState === "visible";
    // The official renderer consumes this event for focus-aware UI behavior.
    reply({ type: "electron-window-focus-changed", isFocused: focused,
      occurredAtMs: Date.now() });
    const threadId = paths.internalPath(location.pathname).match(/^\/local\/([^/]+)/)?.[1] || null;
    const payload = JSON.stringify({
      clientId: notificationClientId, focused, visible: document.visibilityState === "visible",
      threadId, closed
    });
    // Keepalive supports pagehide while still carrying the CSRF request header.
    fetch("/__bridge/notifications/presence", {
      method: "POST", headers: { "content-type": "application/json" }, body: payload,
      keepalive: closed
    }).catch(() => {});
  };
  // Heartbeats expire server-side if a browser crashes without pagehide.
  window.addEventListener("focus", () => reportWindowFocus());
  window.addEventListener("blur", () => reportWindowFocus());
  document.addEventListener("visibilitychange", () => reportWindowFocus());
  window.addEventListener("pagehide", () => reportWindowFocus(true));
  setInterval(reportWindowFocus, 2000);
  // The official renderer keeps its own memory history. Mirror its navigation
  // without forcing a reload; popstate replays the URL into that same router.
  window.__codexBrowserRouteChanged = (route, action) => {
    const path = paths.publicPath(`${route.pathname}${route.search || ""}${route.hash || ""}`);
    if (path === `${location.pathname}${location.search}${location.hash}`) return;
    const method = action === "REPLACE" ? "replaceState" : "pushState";
    history[method](null, "", path);
  };
  window.addEventListener("popstate", () => {
    window.__codexBrowserNavigate?.(
      `${paths.internalPath(location.pathname)}${location.search}${location.hash}`
    );
  });
  const terminalRequest = async (method, params = {}) => {
    const response = await fetch("/__bridge/worker", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        workerId: "terminal",
        request: { id: crypto.randomUUID(), method, params }
      })
    });
    const result = await response.json();
    if (result.type !== "ok") throw new Error(result.error?.message || "terminal request failed");
    return result.value;
  };
  const localFileRequest = async (operation, filePath, options = {}) => {
    const response = await fetch("/__bridge/files", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ operation, path: filePath, ...options })
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "local file request failed");
    return payload;
  };
  const rewriteLocalImages = (root = document) => {
    const images = root instanceof HTMLImageElement ? [root] : root.querySelectorAll?.("img") || [];
    for (const image of images) {
      const source = image.getAttribute("src");
      if (!source?.startsWith("app://fs/@fs/")) continue;
      const localPath = decodeURIComponent(source.slice("app://fs/@fs/".length));
       image.src = paths.publicPath(`/__bridge/local-image?path=${encodeURIComponent(localPath)}`);
    }
  };
  const imageObserver = new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === "attributes") rewriteLocalImages(record.target);
      else for (const node of record.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) rewriteLocalImages(node);
      }
    }
  });
  imageObserver.observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ["src"] });
  rewriteLocalImages();
  window.__codexBrowserFiles = {
    stat: (filePath) => localFileRequest("stat", filePath),
    read: (filePath) => localFileRequest("read", filePath),
    list: (directoryPath) => localFileRequest("list", directoryPath),
  };
  const realMethods = new Set([
    "config/read", "configRequirements/read", "account/read", "getAuthStatus",
    // These account methods are implemented by the local app-server. Keep
    // their official response payloads intact instead of synthesizing plan
    // or quota values in the browser host.
    "account/rateLimits/read", "account/usage/read",
    "account/workspaceMessages/read", "getConversationSummary",
    "model/list", "collaborationMode/list", "mcpServerStatus/list",
    "experimentalFeature/list", "permissionProfile/list", "plugin/list",
    "plugin/installed", "app/list", "skills/list",
    "thread/list", "thread/start", "thread/read", "thread/resume", "thread/fork",
    "thread/delete", "thread/unsubscribe", "thread/attachment/list", "thread/goal/get",
    // Editing the latest user turn reverts it before submitting the replacement.
    "thread/revert",
    "thread/name/set", "thread/interrupt", "thread/archive", "thread/unarchive",
    "turn/start", "turn/interrupt", "turn/steer", "turn/compact/start",
    "thread/items/list", "thread/turns/list", "thread/timeline/list",
    "thread/loaded/list", "thread/tokenUsage/read",
    "fuzzyFileSearch/sessionStart", "fuzzyFileSearch/sessionUpdate",
    "fuzzyFileSearch/sessionStop",
    "fs/readFile", "fs/writeFile", "fs/createDirectory", "fs/getMetadata",
    "fs/readDirectory", "fs/remove", "fs/copy", "fs/watch", "fs/unwatch",

    // Forward the CLI-owned project and thread organization protocol. The
    // browser host still keeps its compatibility mapping for legacy UI
    // endpoints, but these RPCs now use the app-server as the source of truth.
    "project/list", "project/read", "project/create", "project/import",
    "project/update", "project/move", "project/delete",
    "thread/increment_elicitation", "thread/decrement_elicitation",
    "thread/goal/set", "thread/goal/clear",
    "thread/queue/add", "thread/queue/list", "thread/queue/update",
    "thread/queue/delete", "thread/queue/reorder", "thread/queue/start",
    "thread/metadata/update", "thread/attachment/add",
    "thread/attachment/remove", "thread/section/move",
    "thread/settings/update", "thread/memoryMode/set",
    "thread/search", "thread/searchOccurrences", "thread/inject_items",
    "thread/shellCommand", "thread/approveGuardianDeniedAction",
    "thread/backgroundTerminals/clean", "thread/backgroundTerminals/list",
    "thread/backgroundTerminals/terminate",
    "threadSection/list", "threadSection/create", "threadSection/update",
    "threadSection/delete",
    "memory/status", "memory/reset", "rollout/compress",
    "turn/settings/update",
    "thread/realtime/start", "thread/realtime/appendAudio",
    "thread/realtime/appendText", "thread/realtime/appendSpeech",
    "thread/realtime/stop", "thread/realtime/listVoices",
    "fuzzyFileSearch",

    // Configuration, skills, plugins, apps, and MCP are CLI-owned state.
    // Keeping them on the same RPC path prevents the browser host from
    // inventing partial response shapes when the CLI already knows them.
    "config/value/write", "config/batchWrite", "config/mcpServer/reload",
    "skills/extraRoots/set", "skills/config/write",
    "hooks/list", "marketplace/add", "marketplace/remove",
    "marketplace/upgrade", "plugin/search", "plugin/reconcile",
    "plugin/read", "plugin/skill/read", "plugin/install", "plugin/uninstall",
    "plugin/share/save", "plugin/share/updateTargets", "plugin/share/list",
    "plugin/share/checkout", "plugin/share/delete",
    "app/read", "app/installed",
    "mcpServer/resource/read", "mcpServer/event/stream/start",
    "mcpServer/event/stream/stop", "mcpServer/tool/call",
    "mcpServer/oauth/login",

    // These are executable capabilities owned by the local CLI process.
    // The app-server remains responsible for policy and approval handling.
    "command/exec", "command/exec/write", "command/exec/terminate",
    "command/exec/resize", "process/spawn", "process/writeStdin",
    "process/kill", "process/resizePty", "environment/add",
    "environment/info", "environment/status",

    // Account, authentication, diagnostics, review, and capability RPCs
    // are forwarded when the installed CLI exposes them.
    "server/diagnostics", "userVerification/status",
    "userVerification/enroll", "userVerification/delete",
    "userVerification/verify", "userVerification/cancel",
    "account/login/start", "account/login/cancel", "account/logout",
    "account/bedrock/discover", "account/bedrock/setup",
    "account/rateLimitResetCredit/consume",
    "account/sendAddCreditsNudgeEmail", "feedback/upload",
    "externalAgentConfig/detect", "externalAgentConfig/import",
    "externalAgentConfig/import/recordHistory",
    "externalAgentConfig/import/readHistories", "gitDiffToRemote",
    "modelProvider/capabilities/read", "review/start",
    "experimentalFeature/enablement/set",
    "windowsSandbox/setupStart", "windowsSandbox/readiness",
    "remoteControl/enable", "remoteControl/disable",
    "remoteControl/status/read", "remoteControl/pairing/start",
    "remoteControl/pairing/status", "remoteControl/client/list",
    "remoteControl/client/revoke"
  ]);
  const exampleFetchPaths = [
    "/account-info", "/os-info", "/is-copilot-api-available",
    "/codex-home", "/workspace-root-options",
    "/locale-info"
  ];
  // Verified desktop-host contracts; all other requests keep explicit errors.
  const hostFetchPaths = [
    "/ensure-directory", "/git-origins", "/worktree-shell-environment-config",
    "/codex-command-keymap-state", "/email-domain-mail-provider", "/ambient-suggestions",
    "/projectless-thread-cwd", "/projectless-workspace-root",
    "/wsl-bash-availability", "/third-party-notices"
  ];
  const classifyMcp = (method) =>
    realMethods.has(method) ? "real-forward" : "unhandled";
  const classifyFetch = (url) => {
    const pathName = telemetrySafePath(url);
    if (hostFetchPaths.some(path => pathName.endsWith(path)) ||
        ["/get-copilot-api-proxy-info", "/mcp-codex-config",
          "/global-dictation-hotkey-state", "/save-file"].some(path => pathName.endsWith(path))) {
      return "local-bridge";
    }
    if (pathName.endsWith("/codex-agents-md") ||
        pathName.endsWith("/codex-agents-md-save") ||
        pathName.endsWith("/paths-exist") ||
        pathName.endsWith("/developer-instructions") ||
        pathName.endsWith("/workspace-directory-entries") ||
        pathName.endsWith("/read-file-metadata") ||
        pathName.endsWith("/read-file") ||
        pathName.endsWith("/read-file-binary") ||
        pathName.includes("/fs/") ||
        pathName.endsWith("/list-directory") ||
        pathName.endsWith("/file-info") ||
        pathName.endsWith("/set-setting") ||
        pathName.endsWith("/set-settings") ||
        pathName.endsWith("/get-setting") ||
        pathName.endsWith("/get-settings") ||
        pathName.endsWith("/set-thread-pinned") ||
        pathName.endsWith("/list-pinned-threads") ||
        pathName.endsWith("/queued-follow-up-send-lock-acquire") ||
        pathName.endsWith("/queued-follow-up-send-lock-release") ||
        pathName.endsWith("/get-global-state") ||
        pathName.endsWith("/set-global-state")) return "local-bridge";
    if (exampleFetchPaths.some(path => pathName.endsWith(path))) return "example-fallback";
    return "unhandled";
  };
  let notificationCursor = 0;
  let requestCursor = 0;
  let workerEventCursor = 0;
  let notificationsPending = false;
  let requestsPending = false;
  let workerEventsPending = false;
  // HTTP acknowledgements must not settle the renderer's long-lived worker RPC.
  const pendingWorkerRequests = new Map();
  const workerClientId = crypto.randomUUID();
  window.addEventListener("pagehide", () => {
    for (const [id, workerId] of pendingWorkerRequests) {
      fetch("/__bridge/worker-cancel", {
        method: "POST", keepalive: true,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ workerId, id })
      }).catch(() => {});
    }
  });
  const pollRealNotifications = async () => {
    if (notificationsPending) return;
    notificationsPending = true;
    try {
      const response = await fetch(`/__bridge/notifications?after=${notificationCursor}`, { cache: "no-store" });
      const payload = await response.json();
      notificationCursor = payload.cursor || notificationCursor;
      for (const entry of payload.notifications || []) {
        recordThreadProject(entry.message?.params?.thread);
        reply({ type: "mcp-notification", hostId: "local", ...entry.message });
      }
    } catch {} finally {
      notificationsPending = false;
    }
  };
  setInterval(pollRealNotifications, 250);
  const pollRealRequests = async () => {
    if (requestsPending) return;
    requestsPending = true;
    try {
      const response = await fetch(`/__bridge/requests?after=${requestCursor}`, { cache: "no-store" });
      const payload = await response.json();
      requestCursor = payload.cursor || requestCursor;
      for (const entry of payload.requests || []) {
        reply({
          type: "mcp-request",
          hostId: "local",
          request: entry.message
        });
      }
    } catch {} finally {
      requestsPending = false;
    }
  };
  setInterval(pollRealRequests, 250);
  const pollWorkerEvents = async () => {
    if (workerEventsPending) return;
    workerEventsPending = true;
    try {
      const response = await fetch(`/__bridge/worker-events?after=${workerEventCursor}&clientId=${workerClientId}`, { cache: "no-store" });
      const payload = await response.json();
      workerEventCursor = payload.cursor || workerEventCursor;
      for (const entry of payload.events || []) {
        if (entry.workerId === "terminal") {
          for (const listener of terminalHostListeners) {
            try {
              const delivered = listener(entry.event);
              if (delivered?.catch) delivered.catch(error =>
                window.__codexBrowserErrors.push(String(error?.stack || error)));
            } catch (error) {
              window.__codexBrowserErrors.push(String(error?.stack || error));
              terminalHostListeners.delete(listener);
              listener[Symbol.dispose]?.();
            }
          }
        }
        for (const listener of workerListeners.get(entry.workerId) || []) {
          // Detached subscriptions finish on this channel, not their HTTP ack.
          const message = entry.event.type === "worker-response" ? entry.event : {
            type: "worker-event",
            workerId: entry.workerId,
            event: entry.event
          };
          if (message.type === "worker-response") pendingWorkerRequests.delete(message.response.id);
          listener(message);
        }
      }
    } catch {} finally {
      workerEventsPending = false;
    }
  };
  setInterval(pollWorkerEvents, 150);
  const notify = (method, params) => reply({
    type: "mcp-notification", hostId: "local", method, params
  });
  window.addEventListener("error", (event) => {
    window.__codexBrowserErrors.push(String(event.message));
  });
  window.addEventListener("unhandledrejection", (event) => {
    window.__codexBrowserErrors.push(String(event.reason));
  });
  window.codexWindowType = "electron";
  const record = (message) => {
    // Extensions may reject a host-only UI request before it reaches the
    // backend. The response keeps the renderer promise finite and explicit.
    const policy = window.__codexBrowserExtensionPolicy?.beforeBridgeMessage?.(message);
    if (policy?.blocked) {
      queueBridgeTelemetry({
        kind: message?.type || "unknown",
        key: policy.reason || "extension-blocked",
        category: "extension-policy",
        outcome: "error",
        status: 410,
        fields: policy.fields
      });
      if (message?.type === "fetch" && message.requestId != null) {
        reply({
          type: "fetch-response",
          responseType: "error",
          requestId: message.requestId,
          status: 410,
          headers: { "content-type": "application/json" },
          bodyJsonString: JSON.stringify({
            error: "该前端功能已由扩展禁用",
            code: "FRONTEND_EXTENSION_DISABLED"
          })
        });
      }
      if (message?.type === "worker-request" && message.request?.id != null) {
        // Worker callers have their own response channel, so do not leave an
        // outstanding promise when an extension rejects their operation.
        for (const listener of workerListeners.get(message.workerId) || []) {
          listener({
            type: "worker-response",
            workerId: message.workerId,
            response: {
              id: message.request.id, method: message.request.method,
              result: { type: "error", error: {
                code: "FRONTEND_EXTENSION_DISABLED",
                message: "该前端功能已由扩展禁用"
              } },
              emittedAtMs: Date.now()
            }
          });
        }
      }
      return false;
    }
    if (message?.type === "electron-window-focus-request") {
      reportWindowFocus();
      return;
    }
    if (message?.type === "mcp-request") {
      const method = message.request?.method || "(unknown)";
      trackBridgeRequest("mcp-request", message.request?.id, {
        kind: "mcp-request",
        key: method,
        category: classifyMcp(method),
        fields: Object.keys(message.request?.params || {})
      });
    } else if (message?.type === "fetch") {
      trackBridgeRequest("fetch", message.requestId, {
        kind: "fetch",
        key: telemetrySafePath(message.url),
        category: classifyFetch(message.url),
        fields: Object.keys(message.body ? (() => {
          try { return JSON.parse(message.body) || {}; } catch { return {}; }
        })() : {})
      });
    } else if (message?.type === "worker-request") {
      const workerId = message.workerId || "(unknown)";
      queueBridgeTelemetry({
        kind: "worker-request",
        key: `${workerId}:${message.request?.method || "(unknown)"}`,
        category: workerId === "computer-use" ? "empty-fallback" : "local-bridge",
        outcome: "received",
        fields: Object.keys(message.request?.params || {})
      });
    }
    if (message?.type === "mcp-response") {
      forwardServerResponse(message);
    }
    seen.push({
      at: performance.now(),
      type: message?.type || "(unknown)",
      keys: Object.keys(message || {}),
      request: ["mcp-request", "fetch", "shared-object-subscribe", "persisted-atom-sync-request"].includes(message?.type)
        ? JSON.stringify(message, (_key, value) => typeof value === "string" && value.length > 120 ? value.slice(0, 120) + "..." : value).slice(0, 600)
        : undefined,
      method: message?.type === "mcp-request" ? message.request?.method : undefined,
      params: message?.type === "mcp-request" && /^(thread|turn)\//.test(message.request?.method)
        ? message.request?.params : undefined,
      worker: message?.type === "worker-request"
        ? JSON.stringify(message).slice(0, 1000) : undefined,
      diagnostic: message?.type === "log-message" ? {
        message: String(message.message || "").slice(0, 400),
        error: String(message.tags?.sensitive?.error?.message || message.tags?.sensitive?.error || "").slice(0, 500),
        stack: String(message.tags?.sensitive?.error?.stack || "").slice(0, 600),
      } : undefined,
    });
    if (seen.length > 200) seen.shift();
    if (message?.type === "mcp-request" && realMethods.has(message.request?.method)) {
      pendingMcpRequests.set(String(message.request?.id), {
        method: message.request?.method,
        params: message.request?.params || {},
        hostId: message.hostId || "local"
      });
      fetch("/__bridge/rpc", {
        method: "POST",
        headers: bridgeTraceHeaders("mcp-request", message.request?.id),
        body: JSON.stringify(message),
      }).then(async (response) => {
        const payload = await response.json();
        if (payload.message) {
          const result = payload.message.result;
          recordThreadProjects(result?.data);
          recordThreadProject(result?.thread);
          reply({ type: "mcp-response", hostId: payload.hostId || "local", message: payload.message });
        } else {
          reply({
            type: "mcp-response",
            hostId: message.hostId || "local",
            message: {
              id: message.request?.id,
              error: { code: -32000, message: payload.error || "app-server proxy failed" }
            }
          });
        }
      }).catch((error) => {
        reply({
          type: "mcp-response",
          hostId: message.hostId || "local",
          message: {
            id: message.request?.id,
            error: { code: -32000, message: String(error?.message || error) }
          }
        });
      });
      return;
    }
    if (message?.type === "open-in-browser") {
      try {
        const target = new URL(message.url);
        if (!["http:", "https:", "mailto:"].includes(target.protocol)) {
          throw new Error("unsupported external URL");
        }
        window.open(target.href, "_blank", "noopener,noreferrer");
        queueBridgeTelemetry({ kind: "ui-action", key: "open-in-browser",
          category: "local-bridge", outcome: "submitted" });
      } catch {
        queueBridgeTelemetry({ kind: "ui-action", key: "open-in-browser",
          category: "local-bridge", outcome: "error" });
      }
      return;
    }
    fetch("/__bridge/message", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type: message?.type }),
    }).catch(() => {});
    if (message?.type === "persisted-atom-sync-request") {
      reply({
        type: "persisted-atom-sync",
        state: persistedAtoms,
        canWritePrimaryWindowTabPersistence: true
      });
    } else if (message?.type === "persisted-atom-update") {
      const key = typeof message.key === "string" ? message.key : "";
      if (key) {
        if (message.deleted || (message.value === undefined && message.recordUpdate === undefined)) {
          delete persistedAtoms[key];
        } else {
          persistedAtoms[key] = message.value !== undefined
            ? message.value
            : message.recordUpdate;
        }
        savePersistedAtoms();
      }
    } else if (message?.type === "fetch") {
      const url = message.url || "";
      let params = {};
      try { params = JSON.parse(message.body || "{}"); } catch {}
      if (["/get-global-state", "/set-global-state"].some(path => url.endsWith(path)) &&
          Object.values(threadProjectStateKeys).includes(params.key)) {
        const saving = url.endsWith("/set-global-state");
        threadProjectStateRequest(saving
          ? { operation: "setGlobalState", key: params.key, value: params.value } : undefined)
          .then(() => reply({
            type: "fetch-response", requestId: message.requestId,
            responseType: "success", status: 200, headers: { "content-type": "application/json" },
            bodyJsonString: JSON.stringify(saving ? { success: true } : { value: globalState.get(params.key) })
          })).catch(error => reply({
            type: "fetch-response", requestId: message.requestId,
            responseType: "error", status: 400, headers: { "content-type": "application/json" },
            bodyJsonString: JSON.stringify({ error: String(error?.message || error) })
          }));
        return;
      }
      if (hostFetchPaths.some(path => url.endsWith(path))) {
        const request = hostFetchPaths.find(path => url.endsWith(path)).slice(1);
        // Preserve HTTP and upstream errors rather than synthesizing successful data.
        fetch("/__bridge/host-fetch", {
          method: "POST", headers: bridgeTraceHeaders("fetch", message.requestId),
          body: JSON.stringify({ request, params })
        }).then(async response => {
          const result = await response.json();
          if (response.ok && request === "projectless-workspace-root") {
            projectlessWorkspaceRoot = result.workspaceRoot;
          }
          reply({
            type: "fetch-response", requestId: message.requestId,
            responseType: response.ok ? "success" : "error", status: response.status,
            headers: { "content-type": "application/json" },
            bodyJsonString: JSON.stringify(result)
          });
        }).catch(error => reply({
          type: "fetch-response", requestId: message.requestId,
          responseType: "error", status: 502,
          headers: { "content-type": "application/json" },
          bodyJsonString: JSON.stringify({ error: String(error?.message || error) })
        }));
        return;
      }
      if (url.endsWith("/save-file")) {
        // Browsers save to the client, not to an arbitrary backend save-dialog path.
        (async () => {
          let blob;
          if (params.kind === "contents") {
            const binary = atob(params.contentsBase64);
            blob = new Blob([Uint8Array.from(binary, character => character.charCodeAt(0))]);
          } else if (typeof params.sourcePath === "string") {
            if (params.hostId != null && params.hostId !== "local") throw new Error("Remote file downloads are unsupported");
            const response = await fetch(paths.publicPath(
              `/__bridge/local-file?download=1&path=${encodeURIComponent(params.sourcePath)}`));
            if (!response.ok) throw new Error(`File download failed: ${response.status}`);
            blob = await response.blob();
          } else {
            throw new Error("Unsupported save-file kind");
          }
          const name = String(params.suggestedFilename || "download").replace(/[<>:"/\\|?*]/g, "_");
          const objectUrl = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = objectUrl;
          link.download = name;
          document.body.appendChild(link);
          link.click();
          link.remove();
          setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
          // This is a client download name, not a claimed backend filesystem path.
          reply({ type: "fetch-response", requestId: message.requestId,
            responseType: "success", status: 200,
            headers: { "content-type": "application/json" },
            bodyJsonString: JSON.stringify({ path: name }) });
        })().catch(error => reply({
          type: "fetch-response", requestId: message.requestId,
          responseType: "error", status: 400,
          headers: { "content-type": "application/json" },
          bodyJsonString: JSON.stringify({ error: String(error?.message || error) })
        }));
        return;
      }
      if (url.endsWith("/queued-follow-up-send-lock-acquire") ||
          url.endsWith("/queued-follow-up-send-lock-release")) {
        const acquiring = url.endsWith("/queued-follow-up-send-lock-acquire");
        // The official queued-message runner must obtain the shared host lease
        // before it prepares a turn/steer or an automatic queued turn/start.
        fetch(`/__bridge/queued-follow-up-send-lock/${acquiring ? "acquire" : "release"}`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: message.body || "{}"
        }).then(async response => {
          const body = await response.json();
          // An old backend must fail explicitly, not masquerade as a busy lock.
          if (response.ok && acquiring && typeof body.acquired !== "boolean") {
            throw new Error("Backend send lock response is missing acquired");
          }
          reply({
            type: "fetch-response",
            responseType: response.ok ? "success" : "error",
            requestId: message.requestId,
            status: response.status,
            headers: { "content-type": "application/json" },
            bodyJsonString: JSON.stringify(body)
          });
        }).catch(error => reply({
          type: "fetch-response",
          responseType: "error",
          requestId: message.requestId,
          status: 502,
          headers: { "content-type": "application/json" },
          bodyJsonString: JSON.stringify({ error: String(error?.message || error) })
        }));
        return;
      }
      // Both desktop pin operations share the official global-state source.
      if (url.endsWith("/set-thread-pinned") || url.endsWith("/list-pinned-threads") ||
          (url.endsWith("/get-global-state") && params.key === "pinned-thread-ids")) {
        const isGlobalState = url.endsWith("/get-global-state");
        fetch("/__bridge/pinned-threads", {
          method: url.endsWith("/set-thread-pinned") ? "POST" : "GET",
          headers: { "content-type": "application/json" },
          ...url.endsWith("/set-thread-pinned") ? { body: JSON.stringify(params) } : {}
        }).then(async response => {
          const data = await response.json();
          reply({
            type: "fetch-response",
            responseType: response.ok ? "success" : "error",
            requestId: message.requestId,
            status: response.status,
            headers: { "content-type": "application/json" },
            bodyJsonString: JSON.stringify(isGlobalState && response.ok
              ? { value: data.threadIds } : data)
          });
        }).catch(error => reply({
          type: "fetch-response",
          responseType: "error",
          requestId: message.requestId,
          status: 500,
          headers: { "content-type": "application/json" },
          bodyJsonString: JSON.stringify({ error: String(error?.message || error) })
        }));
        return;
      }
      if (url.endsWith("/codex-agents-md") || url.endsWith("/codex-agents-md-save")) {
        fetch("/__bridge/agents", {
          method: url.endsWith("/codex-agents-md-save") ? "POST" : "GET",
          headers: { "content-type": "application/json" },
          ...url.endsWith("/codex-agents-md-save") ? { body: JSON.stringify(params) } : {}
        }).then(async response => {
          const body = await response.json();
          reply({
            type: "fetch-response",
            responseType: response.ok ? "success" : "error",
            requestId: message.requestId,
            status: response.status,
            headers: { "content-type": "application/json" },
            bodyJsonString: JSON.stringify(body)
          });
        }).catch(error => {
          reply({
            type: "fetch-response",
            responseType: "error",
            requestId: message.requestId,
            status: 500,
            headers: { "content-type": "application/json" },
            bodyJsonString: JSON.stringify({ error: String(error?.message || error) })
          });
        });
        return;
      }
      if (url.endsWith("/paths-exist")) {
        Promise.all((params.paths || []).map(async filePath => {
          try {
            await localFileRequest("stat", filePath);
            return filePath;
          } catch { return null; }
        })).then(paths => reply({
          type: "fetch-response",
          responseType: "success",
          requestId: message.requestId,
          status: 200,
          headers: { "content-type": "application/json" },
          bodyJsonString: JSON.stringify({ existingPaths: paths.filter(Boolean) })
        }));
        return;
      }
      if (url.endsWith("/developer-instructions")) {
        reply({
          type: "fetch-response",
          responseType: "success",
          requestId: message.requestId,
          status: 200,
          headers: { "content-type": "application/json" },
          bodyJsonString: JSON.stringify({ instructions: "" })
        });
        return;
      }
      if (url.endsWith("/workspace-directory-entries")) {
        const root = params.workspaceRoot;
        const directoryPath = params.directoryPath || root;
        const pathToList = /^[A-Za-z]:[\\/]/.test(directoryPath) || directoryPath.startsWith("/")
          ? directoryPath : `${root.replace(/[\\/]+$/, "")}\\${directoryPath}`;
        localFileRequest("list", pathToList).then(result => reply({
          type: "fetch-response",
          responseType: "success",
          requestId: message.requestId,
          status: 200,
          headers: { "content-type": "application/json" },
          bodyJsonString: JSON.stringify({
            entries: result.entries
              .filter(entry => params.includeHidden || !entry.name.startsWith("."))
              .map(entry => ({
                ...entry,
                path: `${root.replace(/[\\/]+$/, "")}/${entry.path.slice(root.length).replace(/^[\\/]+/, "").replace(/\\/g, "/")}`,
                type: entry.kind
              }))
          })
        })).catch(error => reply({
          type: "fetch-response",
          responseType: "error",
          requestId: message.requestId,
          status: 400,
          headers: { "content-type": "application/json" },
          bodyJsonString: JSON.stringify({ error: String(error?.message || error) })
        }));
        return;
      }
      if (url.endsWith("/read-file-metadata") || url.endsWith("/read-file") ||
          url.endsWith("/read-file-binary")) {
        const operation = url.endsWith("/read-file-metadata") ? "metadata" : "read";
        localFileRequest(operation, params.path, {
          contentSampleByteLimit: params.contentSampleByteLimit,
          maxBytes: params.maxBytes,
          representation: url.endsWith("/read-file-binary") ? "base64" : "text"
        }).then(file => reply({
          type: "fetch-response",
          responseType: "success",
          requestId: message.requestId,
          status: 200,
          headers: { "content-type": "application/json" },
          bodyJsonString: JSON.stringify(
            operation === "metadata" ? file :
              url.endsWith("/read-file-binary")
                ? { contentsBase64: file.dataBase64, mimeType: file.mimeType }
                : { contents: file.content }
          )
        })).catch(error => reply({
          type: "fetch-response",
          responseType: "error",
          requestId: message.requestId,
          status: 400,
          headers: { "content-type": "application/json" },
          bodyJsonString: JSON.stringify({ error: String(error?.message || error) })
        }));
        return;
      }
      if (url.includes("/fs/") || url.endsWith("/read-file") ||
          url.endsWith("/list-directory") || url.endsWith("/file-info")) {
        const operation = url.endsWith("/list-directory")
          ? "list"
          : url.endsWith("/read-file") ? "read" : "stat";
        localFileRequest(operation, params.path || params.filePath || params.fsPath)
          .then((body) => reply({
            type: "fetch-response",
            responseType: "success",
            requestId: message.requestId,
            status: 200,
            headers: { "content-type": "application/json" },
            bodyJsonString: JSON.stringify(body)
          }))
          .catch((error) => reply({
            type: "fetch-response",
            responseType: "error",
            requestId: message.requestId,
            status: 400,
            headers: { "content-type": "application/json" },
            bodyJsonString: JSON.stringify({ error: String(error?.message || error) })
          }));
        return;
      }
      if (["/get-setting", "/get-settings", "/set-setting", "/set-settings"].some(path => url.endsWith(path))) {
        const saving = url.endsWith("/set-setting") || url.endsWith("/set-settings");
        const single = url.endsWith("/get-setting");
        const values = url.endsWith("/set-setting")
          ? { [params.key]: params.value }
          : params.values || params.settings || params;
        fetch("/__bridge/settings", {
          method: saving ? "POST" : "GET",
          cache: "no-store",
          headers: { "content-type": "application/json" },
          ...(saving ? { body: JSON.stringify(values) } : {})
        }).then(async response => {
          const updated = await response.json();
          if (response.ok && updated && typeof updated === "object") {
            // Replace, not merge: resetting a key must remove its cached value.
            // Single and bulk reads also see changes made by another client.
            for (const key of Object.keys(desktopSettings)) delete desktopSettings[key];
            Object.assign(desktopSettings, updated);
            applyBrowserAppearance();
          }
          // This is the official desktop's response shape. A missing value
          // is intentional and lets the packaged renderer select its default.
          const body = response.ok
            ? saving ? { success: true }
              : single ? { value: updated[params.key] }
                : { configuredValues: { ...updated }, values: { ...updated } }
            : updated;
          reply({
            type: "fetch-response",
            responseType: response.ok ? "success" : "error",
            requestId: message.requestId,
            status: response.status,
            headers: { "content-type": "application/json" },
            bodyJsonString: JSON.stringify(body),
          });
        }).catch(error => {
          reply({
            type: "fetch-response",
            responseType: "error",
            requestId: message.requestId,
            status: 500,
            headers: { "content-type": "application/json" },
            bodyJsonString: JSON.stringify({ error: String(error?.message || error) }),
          });
        });
        return;
      }
      const body = url.endsWith("/get-global-state")
        ? { value: globalState.get(params.key) ?? null }
        : url.endsWith("/account-info")
          ? {
              accountId: "browser-demo-account",
              userId: "browser-demo-user",
              authenticatedUserId: "browser-demo-user",
              plan: "pro",
              email: "demo@example.invalid",
              computeResidency: null,
              hasChatGptToken: true
            }
        : url.endsWith("/set-global-state")
          ? (() => {
              globalState.set(params.key, params.value);
              if (!authoritativeGlobalStateKeys.has(params.key)) {
                persistBrowserGlobalState();
              }
              if (params.key === "appearance-settings" && params.value &&
                  typeof params.value === "object") {
                browserAppearance = { ...browserAppearance, ...params.value };
                saveBrowserAppearance();
              }
              if (["uiFontSize", "chatFontSize", "codeFontSize"].includes(params.key)) {
                browserAppearance = { ...browserAppearance, [params.key]: params.value };
                saveBrowserAppearance();
              }
              return { success: true };
            })()
        : url.endsWith("/os-info")
          ? {
              platform: "win32",
              osVersion: "10.0.0",
              osRelease: "10.0.0",
              isSystemBackdropSupported: false,
              isVsCodeRunningInsideWsl: false,
              isCodexRunningInsideWsl: false,
              windowsAccountType: null
            }
        : url.endsWith("/is-copilot-api-available")
          ? { available: false }
        // Official null disables proxy overrides; {} would enable a bogus provider.
        : url.endsWith("/get-copilot-api-proxy-info")
          ? null
        : url.endsWith("/mcp-codex-config")
          ? { config: {} } // CLI retains its own config; no desktop tool registrations.
        : url.endsWith("/global-dictation-hotkey-state")
          ? { supported: false, configuredHotkey: null, configuredToggleHotkey: null }
        : url.endsWith("/codex-home")
          ? { codexHome: codexHomeRoot }
        : url.endsWith("/workspace-root-options")
          ? {
              roots: projects.flatMap(project => project.rootPaths),
              canonicalPathByRoot: Object.fromEntries(
                projects.flatMap(project => project.rootPaths.map(root => [root, root]))
              ),
              labels: Object.fromEntries(
                projects.flatMap(project => project.rootPaths.map(root => [root, project.name]))
              )
            }
        : url.endsWith("/locale-info")
          ? {
              ideLocale: desktopSettings.localeOverride || navigator.language || "en-US",
              systemLocale: navigator.language || "en-US"
            }
          : undefined;
      // Absence of an adapter is not an empty query result or a successful write.
      // Keep the renderer's fetch envelope so its normal error path can handle it.
      if (body === undefined) {
        const request = telemetrySafePath(url).slice(0, 180);
        reply({
          type: "fetch-response",
          responseType: "error",
          requestId: message.requestId,
          status: 501,
          headers: { "content-type": "application/json" },
          bodyJsonString: JSON.stringify({
            error: `当前网页版不支持此请求：${request}`,
            code: "BRIDGE_UNSUPPORTED_REQUEST",
            request
          })
        });
        return;
      }
      reply({
        type: "fetch-response",
        responseType: "success",
        requestId: message.requestId,
        status: 200,
        headers: { "content-type": "application/json" },
        bodyJsonString: JSON.stringify(body),
      });
    } else if (message?.type === "mcp-request") {
      const method = message.request?.method;
      // Supported methods return above through the real CLI adapter.
      // An unknown RPC must fail without manufacturing a result or model output.
      reply({
        type: "mcp-response",
        hostId: message.hostId || "local",
        message: {
          id: message.request?.id,
          error: {
            code: -32601,
            message: `当前网页版不支持此 RPC：${String(method || "(unknown)").slice(0, 180)}`,
            data: { code: "BRIDGE_UNSUPPORTED_REQUEST" }
          }
        },
      });
    }
  };
  const forwardServerResponse = (message) => {
    // Official approvals use response, while incoming client RPCs use message.
    // Treat JSON-RPC id 0 as valid and report failed forwarding to the renderer.
    const response = message?.response || message?.message;
    if (response?.id == null) return;
    fetch("/__bridge/rpc-response", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ response })
    }).then(async result => {
      if (!result.ok) throw new Error(`Approval response failed: ${await result.text()}`);
    }).catch(error => window.__codexBrowserErrors.push(String(error)));
  };
  window.electronBridge = {
    windowType: "electron",
    // The official renderer asks this service before building file-reference
    // menus. Keep the target model small and truthful for browser reuse:
    // the browser preview is available, while desktop applications are not.
    openIn: {
      async getTargets({ path: filePath } = {}) {
        if (!isBrowserRenderableFile(filePath)) {
          return { preferredTarget: null, availableTargets: [], targets: [] };
        }
        return {
          preferredTarget: "browser",
          availableTargets: ["browser"],
          targets: [{
            target: "browser",
            id: "browser",
            label: "Codex 浏览器",
            kind: "native",
            available: true,
            default: true
          }]
        };
      },
      async open({ path: filePath, target } = {}) {
        if (target === "fileManager") {
          await openFileManager(filePath);
          return { success: true };
        }
        if (
          target !== "browser" ||
          !isBrowserRenderableFile(filePath) ||
          typeof filePath !== "string" ||
          !filePath
        ) {
          return { success: false };
        }
        window.open(
          paths.publicPath(`/__bridge/local-file?path=${encodeURIComponent(filePath)}`),
          "_blank", "noopener,noreferrer"
        );
        queueBridgeTelemetry({ kind: "ui-action", key: "open-in-browser",
          category: "local-bridge", outcome: "submitted" });
        return { success: true };
      },
      async setGlobalPreferredTarget() {
        return { success: true };
      }
    },
    acknowledgeChunkedMessage() {},
    getPreloadStartedAtMs: () => performance.now(),
    async sendMessageFromView(message) {
      if (record(message) === false) return;
      const request = message?.request || message?.terminalRequest;
      if (request && (
        message?.type === "terminal-request" ||
        message?.type === "terminal" ||
        message?.workerId === "terminal"
      )) {
        fetch("/__bridge/worker", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ workerId: "terminal", request })
        }).catch(() => {});
      }
    },
    getPathForFile: (file) => file?.path || null,
    readLocalFile: (filePath) => localFileRequest("read", filePath),
    listLocalDirectory: (directoryPath) => localFileRequest("list", directoryPath),
    statLocalFile: (filePath) => localFileRequest("stat", filePath),
    openPath: async (filePath) => {
      window.open(
        paths.publicPath(`/__bridge/local-file?path=${encodeURIComponent(filePath)}`),
        "_blank", "noopener,noreferrer"
      );
      queueBridgeTelemetry({ kind: "ui-action", key: "open-path",
        category: "local-bridge", outcome: "submitted" });
      return true;
    },
    startFileDrag: () => false,
    startLinkDrag() {},
    async sendWorkerMessageFromView(name, message) {
      if (record(message) === false) return;
      if (message?.type === "worker-request-cancel") {
        // The official Git worker keeps live-query RPCs pending until abort.
        // Forward its cancel message explicitly instead of dropping it.
        fetch("/__bridge/worker-cancel", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ workerId: name, id: message.id })
        }).catch(() => {});
        pendingWorkerRequests.delete(message.id);
        return;
      }
      if (message?.type !== "worker-request") return;
      const { id, method } = message.request;
      if (name === "git" && method === "subscribe-live-query") pendingWorkerRequests.set(id, name);
      fetch("/__bridge/worker", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ workerId: name, request: message.request, clientId: workerClientId })
      }).then(async (response) => {
        const result = await response.json();
        // The official promise remains pending while the background query runs.
        if (result.type === "pending") return;
        pendingWorkerRequests.delete(id);
        const workerResponse = {
          type: "worker-response",
          workerId: name,
          response: {
            id,
            method,
            result,
            emittedAtMs: Date.now()
          }
        };
        for (const listener of workerListeners.get(name) || []) listener(workerResponse);
      }).catch((error) => {
        pendingWorkerRequests.delete(id);
        for (const listener of workerListeners.get(name) || []) listener({
          type: "worker-response",
          workerId: name,
          response: {
            id,
            method,
            result: { type: "error", error: { message: String(error?.message || error) } },
            emittedAtMs: Date.now()
          }
        });
      });
    },
    subscribeToWorkerMessages(name, listener) {
      let listeners = workerListeners.get(name);
      if (!listeners) workerListeners.set(name, listeners = new Set());
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    showContextMenu: async (items) => showBrowserContextMenu(items),
    getFastModeRolloutMetrics: async () => null,
    getSharedObjectSnapshotValue: () => undefined,
    getInitialSidebarBootstrap: () => ({
      catalogEntries: [],
      catalogHostIds: [],
      globalStateEntries: [...globalState].map(([key, value]) => ({ key, value })),
      workspaceRootOptions: {
        canonicalPathByRoot: Object.fromEntries(
          projects.flatMap(project => project.rootPaths.map(root => [root, root]))
        ),
        roots: projects.flatMap(project => project.rootPaths),
        labels: Object.fromEntries(
          projects.flatMap(project => project.rootPaths.map(root => [root, project.name]))
        )
      },
      projectlessWorkspaceRoot: { workspaceRoot: projectlessWorkspaceRoot },
    }),
    getSystemThemeVariant: () => matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
    subscribeToSystemThemeVariant: (listener) => {
      const media = matchMedia("(prefers-color-scheme: dark)");
      const handler = () => listener(media.matches ? "dark" : "light");
      media.addEventListener?.("change", handler);
      return () => media.removeEventListener?.("change", handler);
    },
    readClipboardText: async () => navigator.clipboard?.readText?.() || "",
    writeClipboardText: async (text) => {
      if (!navigator.clipboard?.writeText) return false;
      await navigator.clipboard.writeText(String(text ?? ""));
      return true;
    },
    openExternal: async (target) => {
      if (typeof target !== "string") return false;
      const url = new URL(target, location.href);
      if (!["http:", "https:", "mailto:"].includes(url.protocol)) return false;
      window.open(url.href, "_blank", "noopener,noreferrer");
      queueBridgeTelemetry({ kind: "ui-action", key: "open-external",
        category: "local-bridge", outcome: "submitted" });
      return true;
    },
    // Notifications are host-owned. The renderer sends the same semantic
    // payload to Node, and Node creates the Windows Toast through WinRT.
    showNotification: async (payload = {}) => {
      // Local CLI events are published directly by the backend, even after
      // the page closes. Do not create a second toast from each renderer tab.
      if (["permission", "question", "turn-complete"].includes(payload.kind) &&
          (!payload.hostId || payload.hostId === "local")) return true;
      const response = await fetch("/__bridge/notifications/show", {
        method: "POST",
        headers: { "content-type": "application/json" },
        // Preserve the official notification object. The host needs id,
        // kind, navigationPath and actionType to reproduce desktop behavior.
        body: JSON.stringify({
          ...payload,
          title: String(payload.title || "Codex"),
          body: String(payload.body || ""),
          threadId: payload.threadId || payload.conversationId || null,
          tag: payload.tag || payload.id || null,
          sound: payload.sound || "notification",
          actions: Array.isArray(payload.actions)
            ? payload.actions
            : Array.isArray(payload.buttons) ? payload.buttons : [],
          reply: payload.reply
            ? {
                ...payload.reply,
                url: payload.reply.url || null
              }
            : null
        })
      });
      const result = await response.json().catch(() => ({ shown: false }));
      queueBridgeTelemetry({
        kind: "ui-action",
        key: "windows-notification",
        category: "local-bridge",
        outcome: result.shown ? "success" : "error"
      });
      return Boolean(response.ok && result.shown);
    },
    notifications: {
      show: async (payload = {}) => window.electronBridge.showNotification(payload),
      hide: async (payload = {}) => {
        // Reading a conversation does not resolve its pending CLI approval.
        // Only request-resolution hides may dismiss host-owned local toasts.
        if (!payload.notificationId && !payload.tag) return true;
        const response = await fetch("/__bridge/notifications/hide", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            tag: payload.tag || null,
            notificationId: payload.notificationId || null,
            conversationId: payload.conversationId || null,
            navigationPath: payload.navigationPath || null
          })
        });
        const result = await response.json().catch(() => ({ hidden: false }));
        return Boolean(response.ok && result.hidden);
      }
    },
    triggerSentryTestError: async () => {},
    getSentryInitOptions: () => ({
      codexAppSessionId: "browser-demo",
      buildFlavor: "prod",
      buildNumber: "0",
      appVersion: "0.0.0-browser-demo",
      desktopTraceSampleRate: 0,
      dsn: "",
      initialDesktopTraceSampleRate: 0,
    }),
    getDesktopUserAgent: () => navigator.userAgent,
    getAppSessionId: () => "browser-demo",
    getBuildFlavor: () => "prod",
    isDeviceCheckSupported: () => false,
    isIntelMacBuild: () => false,
  };
  window.addEventListener("message", async (event) => {
    if (event.source !== window || event.data?.type !== "connect-app-host") return;
    try {
      const rpc = await import("/assets/app-shared-dc8f183e4945.js");
      const ready = (data) => ({ status: "ready", data });
      const account = {
        account_id: "browser-demo-account",
        account_user_id: "browser-demo-user",
        account_user_role: "account-owner",
        structure: "personal",
        plan_type: "pro",
        is_zdr: false,
        is_openai_internal: false
      };
      const jsonResponse = (body, status = 200) => ({
        response: new Response(JSON.stringify(body), {
          status,
          headers: { "content-type": "application/json" }
        })
      });
      const readUsage = async () => {
        // The packaged renderer expects the ChatGPT web shape for /wham/usage,
        // while the local app-server exposes the same limits in camelCase.
        const response = await fetch("/__bridge/rpc", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            hostId: "local",
            request: {
              id: `usage-${crypto.randomUUID()}`,
              method: "account/rateLimits/read",
              params: {}
            }
          })
        });
        const payload = await response.json();
        if (!response.ok || payload.message?.error) {
          throw new Error(payload.message?.error?.message || payload.error || "usage request failed");
        }
        const result = payload.message?.result;
        if (!result?.rateLimits) throw new Error("app-server returned no rate limits");
        const limit = result.rateLimits;
        const windowShape = (value) => value ? {
          used_percent: value.usedPercent,
          limit_window_seconds: value.windowDurationMins * 60,
          reset_at: value.resetsAt,
          reset_after_seconds: Math.max(0, value.resetsAt - Math.floor(Date.now() / 1000))
        } : null;
        // Identity is taken from the real CLI response; no demo quota values
        // are mixed into the web usage response.
        return {
          account_id: result.accountId,
          plan_type: limit.planType,
          rate_limit: {
            allowed: result.ordinaryUsageAllowed,
            limit_reached: limit.rateLimitReachedType != null,
            primary_window: windowShape(limit.primary),
            secondary_window: windowShape(limit.secondary)
          },
          credits: limit.credits ? {
            has_credits: limit.credits.hasCredits,
            unlimited: limit.credits.unlimited,
            balance: limit.credits.balance
          } : null,
          rate_limit_reset_credits: result.rateLimitResetCredits ? {
            available_count: result.rateLimitResetCredits.availableCount
          } : null
        };
      };
      const readAssignmentArgs = (input, secondValue) => {
        const value = input && typeof input === "object" ? input : {};
        return {
          threadId: value.threadId || value.conversationId,
          assignment: secondValue ?? value.assignment ?? value.membership ?? value
        };
      };
      const threadProjectAssignments = {
        async setAssignment(input, secondValue) {
          const { threadId, assignment } = readAssignmentArgs(input, secondValue);
          if (!threadId) return;
          await threadProjectStateRequest({ operation: "setAssignments",
            entries: [{ threadId, assignment: assignment?.projectId ? assignment : null }] });
        },
        async setProjectless({ threadId, projectless }) {
          if (!threadId) return;
          await threadProjectStateRequest({ operation: "updateProjectlessThread",
            params: { threadId, projectless } });
        },
        async updateProjectlessThread(params) {
          // This is the official renderer's combined membership/path-hint API.
          await threadProjectStateRequest({ operation: "updateProjectlessThread", params });
        },
        async setMembership(input) {
          const { threadId, assignment } = readAssignmentArgs(input);
          if (!threadId) return;
          await threadProjectStateRequest({ operation: "setAssignments",
            entries: [{ threadId, assignment: assignment?.projectId ? assignment : null }] });
        },
        async restoreMemberships(memberships) {
          const entries = (memberships || []).map(membership => readAssignmentArgs(membership))
            .filter(({ threadId, assignment }) => threadId && assignment?.projectId != null);
          if (entries.length) await threadProjectStateRequest({ operation: "setAssignments", entries });
        },
        async getThreadStartProjectId(projectAssignment) {
          if (projectAssignment?.projectId) return projectAssignment.projectId;
          if (typeof projectAssignment === "string") {
            return projectState[projectAssignment] ? projectAssignment : null;
          }
          return projectAssignment?.id || null;
        }
      };
      const threadReadStateChanged = async ({
        hostId = "local",
        conversationId,
        hasUnreadTurn
      } = {}) => {
        if (!conversationId) return { status: "ignored" };
        const changed = setThreadUnread(hostId, conversationId, Boolean(hasUnreadTurn));
        if (changed) {
          // Match the official client-coordination service by notifying the
          // local renderer after the durable state has been updated.
          notify("thread-read-state-changed", {
            hostId,
            conversationId,
            hasUnreadTurn: Boolean(hasUnreadTurn)
          });
        }
        return { status: "ok" };
      };
      const host = rpc.DI(event.data.port, {
        services: {
          // The renderer suspends first content on the app-info query.
          // Match the browser host identity rather than letting the query retry.
          appInfo: {
            get: async () => ({
              appVersion: "0.0.0-browser-demo",
              buildNumber: "0",
              buildFlavor: "prod"
            })
          },
          // The official desktop-notifications service resolves this RPC
          // service from the host container, rather than window.electronBridge.
          // Keep the callback parameters accepted even though Windows Toast
          // activation opens the deep link in the browser process.
          notifications: {
            async show(notification = {}) {
              return window.electronBridge.showNotification(notification);
            },
            async hide(payload = {}) {
              return window.electronBridge.notifications.hide(payload);
            }
          },
          threadProjectAssignments,
          projectlessWorkspace: {
            async chooseDirectory() {
              const response = await fetch("/__bridge/projectless-workspace-directory", { method: "POST" });
              const result = await response.json();
              if (!response.ok) throw new Error(result.error || "Directory selection failed");
              return result.path;
            }
          },
          threadReadStateChanged,
            // File-reference menus call the host service through the RPC
            // container, not through window.electronBridge. Keep the service
            // contract aligned with the official renderer's openIn module.
            openIn: {
              async getTargets({ path: filePath } = {}) {
                if (!isBrowserRenderableFile(filePath)) {
                  return { preferredTarget: null, availableTargets: [], targets: [] };
                }
                return {
                  preferredTarget: "browser",
                  availableTargets: ["browser"],
                  targets: [{
                    target: "browser",
                    id: "browser",
                    label: "Codex 浏览器",
                    kind: "native",
                    available: true,
                    default: true
                  }]
                };
              },
              async open({ path: filePath, target } = {}) {
                if (target === "fileManager") {
                  await openFileManager(filePath);
                  return { success: true };
                }
                if (
                  target !== "browser" ||
                  !isBrowserRenderableFile(filePath) ||
                  typeof filePath !== "string" ||
                  !filePath
                ) {
                  return { success: false };
                }
                window.open(
                  paths.publicPath(`/__bridge/local-file?path=${encodeURIComponent(filePath)}`),
                  "_blank", "noopener,noreferrer"
                );
                queueBridgeTelemetry({ kind: "ui-action", key: "open-in-browser",
                  category: "local-bridge", outcome: "submitted" });
                return { success: true };
              },
              async setGlobalPreferredTarget() {
                return { success: true };
              }
            },
          terminal: {
            subscribe(listener) {
              const retained = listener.dup();
              terminalHostListeners.add(retained);
              const unsubscribe = () => {
                if (!terminalHostListeners.delete(retained)) return;
                retained[Symbol.dispose]();
              };
              retained.onRpcBroken(unsubscribe);
              return {
                unsubscribe,
                [Symbol.dispose]: unsubscribe
              };
            },
            create: (params) => terminalRequest("create", params),
            attach: (params) => terminalRequest("attach", params),
            attachExisting: async (params = {}) => {
              const attached = await terminalRequest("attachExisting", params);
              if (attached?.attached) return true;
              // A browser page can outlive the backend PTY. Recreate that session
              // with the same id so the official renderer can keep its tab.
              try {
                await terminalRequest("create", params);
                return true;
              } catch {
                return false;
              }
            },
            write: (sessionId, data) => terminalRequest("write", { sessionId, data }),
            resize: (sessionId, cols, rows, force) =>
              terminalRequest("resize", { sessionId, cols, rows, force }),
            close: (sessionId) => terminalRequest("close", { sessionId }),
            getShellCwd: (sessionId) => terminalRequest("getShellCwd", { sessionId }),
            runAction: (sessionId, cwd, command) =>
              terminalRequest("runAction", { sessionId, cwd, command }),
            transferSessionOwnership: async () => false
          },
          workspaceFiles: {
            saveCopy: async ({ path: filePath } = {}) => downloadWorkspaceFile(filePath),
            // Text previews use downloadCopy while artifact menus use saveCopy.
            downloadCopy: async ({ path: filePath } = {}) => downloadWorkspaceFile(filePath),
            async read({ path: filePath, representation = "auto", maxBytes } = {}) {
              const file = await localFileRequest("read", filePath, {
                representation, maxBytes
              });
              return file.dataBase64 == null
                ? { text: file.content }
                : { blob: file.dataBase64, mimeType: file.mimeType };
            },
            async getThumbnailDataUrl({ path: filePath } = {}) {
              const file = await localFileRequest("read", filePath, { representation: "base64" });
              return file.mimeType?.startsWith("image/")
                ? `data:${file.mimeType};base64,${file.dataBase64}` : null;
            },
          },
          fileAttachments: {
            async persistImageFileToTemp({ bytes, mimeType } = {}) {
              const imageBytes = bytes instanceof Uint8Array
                ? bytes
                : new Uint8Array(bytes || []);
              let binary = "";
              for (let offset = 0; offset < imageBytes.length; offset += 8192) {
                binary += String.fromCharCode(...imageBytes.subarray(offset, offset + 8192));
              }
              const response = await fetch("/__bridge/image-attachment", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ dataBase64: btoa(binary), mimeType })
              });
              const result = await response.json();
              if (!response.ok) throw new Error(result.error || "image attachment failed");
              return result.path;
            },
            async countFolderFiles({ folderPath } = {}) {
              const result = await localFileRequest("list", folderPath);
              return result.entries.filter((entry) => entry.kind === "file").length;
            },
          },
          clipboard: {
            async readText() { return navigator.clipboard?.readText?.() || ""; },
            async writeText(value) { await navigator.clipboard?.writeText?.(String(value ?? "")); }
          },
          requestUserInputAutoResolution: {
            setConversationPresented: async () => {},
            recordConversationActivity: async () => {}
          },
          httpFetch: {
            async fetch(_id, request) {
              const url = new URL(request.url, "https://chatgpt.invalid");
              const path = url.pathname;
              seen.push({ at: performance.now(), type: "host-http-fetch", path });
              if (path.endsWith("/accounts/check/v4-2023-04-27")) {
                return jsonResponse({
                  account_ordering: [account.account_id],
                  accounts: {
                    [account.account_id]: { account, can_access_with_session: true }
                  }
                });
              }
              if (path.endsWith("/accounts/optimized/check")) {
                return jsonResponse({
                  account,
                  account_user: {
                    seat_type: "standard",
                    account_user_id: account.account_user_id,
                    pending_seat_upgrade_request: false
                  }
                });
              }
              if (path.endsWith("/wham/accounts/check")) {
                return jsonResponse({
                  accounts: [{ ...account, id: account.account_id }],
                  default_account_id: account.account_id,
                  account_ordering: [account.account_id]
                });
              }
              if (path === "/wham/usage") {
                try {
                  return jsonResponse(await readUsage());
                } catch (error) {
                  window.__codexBrowserErrors.push(String(error?.message || error));
                  return jsonResponse({ error: "usage request failed" }, 502);
                }
              }
              if (path.endsWith("/wham/onboarding/context")) {
                return jsonResponse({ desktop_onboarding_completed_at: "2026-01-01T00:00:00Z" });
              }
              if (path.endsWith("/celsius/ws/user")) {
                return jsonResponse({ connected: false, subscriptions: [] });
              }
              if (path.endsWith("/notifications/settings")) {
                return jsonResponse({ settings: [] });
              }
              if (path.endsWith("/settings")) {
                return jsonResponse({
                  beta_settings: { wham_local_access: true },
                  permissions: [],
                  admin_work_mode_enabled: true,
                  admin_work_local_enabled: true
                });
              }
              if (path.endsWith("/ces/v1/rgstr") ||
                  path.includes("statsig") || path.includes("initialize")) {
                return jsonResponse({
                  has_updates: true,
                  time: Date.now(),
                  // Enable only the renderer gate needed for CLI-supported
                  // Ultra/multi-agent controls. Model/list still determines
                  // each model's efforts; this never invents model capability.
                  feature_gates: {
                    "1186680773": {
                      name: "1186680773", value: true,
                      rule_id: "browser-cli-multi-agent", secondary_exposures: []
                    }
                  },
                  dynamic_configs: {},
                  layer_configs: {
                    "72216192": {
                      name: "72216192",
                      value: {
                        enable_i18n: true,
                        locale_source: "IDE"
                      },
                      rule_id: "browser-local-i18n",
                      secondary_exposures: []
                    }
                  }
                });
              }
              return jsonResponse({ error: "No demo response for " + path }, 404);
            },
            async cancel() {}
          },
          accessInputs: {
            readAccountInfo: async () => ready({
              accountId: account.account_id,
              userId: account.account_user_id,
              authenticatedUserId: account.account_user_id,
              plan: account.plan_type,
              email: "demo@example.invalid",
              computeResidency: null,
              hasChatGptToken: true
            }),
            readAccounts: async () => ready({
              accounts: [{
                ...account,
                id: account.account_id
              }],
              default_account_id: "browser-demo-account",
              account_ordering: ["browser-demo-account"]
            }),
            readWorkspaceSettings: async () => ready({
              beta_settings: {},
              // The official capability gate reads this exact workspace
              // permission name before it wraps links with the official
              // context-menu component.
              permissions: ["chatgpt.workspace.feature.codex-in-app-browser.access"],
              admin_work_mode_enabled: true,
              admin_work_local_enabled: true
            }),
            subscribe: () => () => {},
            invalidate: async () => {},
            invalidateWorkspaceSettings: async () => {}
          }
        }
      });
      window.__codexBrowserHost = host;
      fetch("/__bridge/status").then(response => response.json()).then(status => {
        if (!status.appServerVersion) return;
        const announce = () => reply({
          type: "codex-app-server-initialized",
          hostId: "local",
          appServerVersion: status.appServerVersion,
          installedCodexVersion: status.appServerVersion
        });
        announce();
        // The renderer installs its host-state listener after connect-app-host
        // returns. Repeat briefly so version-gated operations such as thread
        // forking do not observe a missing app-server version.
        [100, 500, 1500].forEach(delay => setTimeout(announce, delay));
      }).catch(error => window.__codexBrowserErrors.push(String(error)));
      seen.push({ at: performance.now(), type: "host-connected" });
    } catch (error) {
      window.__codexBrowserErrors.push(String(error?.stack || error));
    }
  });
})();
