const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { spawn, execFile, execFileSync } = require("node:child_process");
const { randomUUID } = require("node:crypto");
const { createDesktopNotifications } = require("./desktop-notifications");
const { createDesktopSettings } = require("./desktop-settings");
const { adaptRightPanel } = require("./renderer-panel-adapter");
const { createQueuedFollowUpSendLockHandler } = require("./queued-follow-up-send-locks");
const { createLanAccessGuard, isLoopback } = require("./lan-auth");
const { loadDeployment } = require("./deployment");

// Keep the renderer beside the bridge so the whole project can be moved as one unit.
const root = path.join(__dirname, "runtime", "codex-frontend-26.917.9434", "webview");
const extensionsRoot = path.join(__dirname, "extensions");
const extensionsConfigPath = path.join(extensionsRoot, "config.json");
const extensionAssets = {
  "/__extensions/plugins/sidebar-touch-scroll.js": ["plugins", "sidebar-touch-scroll", "plugins/sidebar-touch-scroll.js"],
  "/__extensions/plugins/sidebar-performance.js": ["plugins", "sidebar-performance", "plugins/sidebar-performance.js"],
  "/__extensions/themes/nahida/runtime.js": ["themes", "nahida", "themes/nahida/runtime.js"],
  "/__extensions/themes/nahida/theme.css": ["themes", "nahida", "themes/nahida/theme.css"]
};
const port = Number(process.env.PORT || 4387);
// Relative project paths are portable; CODEX_HOME and CODEX_BIN remain external
// machine-level dependencies because they point to the user's real Codex state.
const workspaceRoot = path.resolve(__dirname);
const codexHome = process.env.CODEX_HOME || path.join(os.homedir(), ".codex");
const configTomlPath = path.join(codexHome, "config.toml");
const agentsFilePath = path.join(codexHome, "AGENTS.md");
const agentsOverridePath = path.join(codexHome, "AGENTS.override.md");
const globalStatePath = path.join(codexHome, ".codex-global-state.json");
function findCodexExecutable() {
  // Prefer an explicit path so portable installs and package managers remain
  // predictable. The other probes only fill in a normal Windows install.
  if (process.env.CODEX_BIN) return path.resolve(process.env.CODEX_BIN);
  const candidates = [];
  try {
    const output = execFileSync(process.platform === "win32" ? "where.exe" : "which",
      ["codex.exe"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    candidates.push(...output.split(/\r?\n/).map(value => value.trim()).filter(Boolean));
  } catch {}
  if (process.platform === "win32") {
    try {
      const installLocation = execFileSync("powershell.exe", [
        "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command",
        "(Get-AppxPackage -Name 'OpenAI.Codex*' | Sort-Object Version -Descending | Select-Object -First 1 -ExpandProperty InstallLocation)"
      ], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
      if (installLocation) {
        candidates.push(path.join(installLocation, "app", "resources", "codex.exe"));
      }
    } catch {}
  }
  return candidates.find(candidate => fs.existsSync(candidate)) || null;
}

const codexExe = findCodexExecutable();
if (!codexExe && require.main?.filename === __filename) {
  throw new Error(
    "Codex CLI was not found. Install Codex, add codex.exe to PATH, or set CODEX_BIN."
  );
}
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  // PDF.js loads its worker as an ES module and rejects octet-stream.
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".pdf": "application/pdf",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".wasm": "application/wasm",
  ".ico": "image/x-icon",
};

// Fail closed before starting the CLI or notifications if credentials are invalid.
const deployment = loadDeployment(__dirname);
const lanCredentialsFile = path.join(__dirname, "config", "lan-auth.json");
const allowRequest = createLanAccessGuard({ credentialsFile: lanCredentialsFile, deployment });

function readExtensionsConfig() {
  const config = JSON.parse(fs.readFileSync(extensionsConfigPath, "utf8"));
  for (const [group, names] of Object.entries({
    plugins: ["sidebar-touch-scroll", "sidebar-performance"],
    themes: ["nahida"]
  })) {
    for (const name of names) {
      if (typeof config[group]?.[name] !== "boolean") {
        throw new Error(`Invalid extension switch: ${group}.${name}`);
      }
    }
  }
  return config;
}

function nahidaCss() {
  // Preserve the source CSS; only substitute the same opacity-adjusted SVG
  // data URLs used by the desktop injector at response time.
  const ornaments = {
    VINE: ["nahida-vine.svg", "0.30"],
    EMBLEM: ["nahida-emblem.svg", "0.17"],
    EMBLEM_HEADER: ["nahida-emblem.svg", "0.32"],
    EMBLEM_PANEL: ["nahida-emblem.svg", "0.30"],
    FILIGREE_STRONG: ["nahida-filigree.svg", "0.38"],
    CORNER_TL: ["nahida-corner-tl.svg", "0.52"],
    CORNER_BR: ["nahida-corner-br.svg", "0.52"]
  };
  let css = fs.readFileSync(path.join(extensionsRoot, "themes/nahida/theme.css"), "utf8");
  for (const [key, [file, opacity]] of Object.entries(ornaments)) {
    const svg = fs.readFileSync(path.join(extensionsRoot, "themes/nahida/ornaments", file), "utf8")
      .replace("<svg ", `<svg opacity="${opacity}" `);
    css = css.replaceAll(`__NHD_${key}_DATA__`, `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`);
  }
  if (/__NHD_[A-Z_]+_DATA__/.test(css)) throw new Error("Unresolved Nahida ornament");
  return css;
}

// Adapt only the packaged memory router. The original asset remains untouched.
// Fail loudly on a new frontend build instead of silently losing URL navigation.
function adaptBrowserRouter(source) {
  const original = "a.current??=Q3e({initialEntries:n,initialIndex:r,v5Compat:!0});let o=a.current,[s,c]=Sd.useState({action:o.action,location:o.location}),l=Sd.useCallback(e=>{i===!1?c(e):Sd.startTransition(()=>c(e))},[i]);return Sd.useLayoutEffect(()=>o.listen(l),[o,l]),Sd.createElement(Q6e";
  const adapted = "a.current??=Q3e({initialEntries:window.__codexBrowserInitialRoute?[window.__codexBrowserInitialRoute]:n,initialIndex:r,v5Compat:!0});let o=a.current,[s,c]=Sd.useState({action:o.action,location:o.location}),l=Sd.useCallback(e=>{window.__codexBrowserRouteChanged?.(e.location,e.action);i===!1?c(e):Sd.startTransition(()=>c(e))},[i]);return Sd.useLayoutEffect(()=>{window.__codexBrowserNavigate=path=>o.replace(path);return()=>{delete window.__codexBrowserNavigate}},[o]),Sd.useLayoutEffect(()=>o.listen(l),[o,l]),Sd.createElement(Q6e";
  if (source.split(original).length !== 2) {
    throw new Error("Packaged memory router signature changed");
  }
  return source.replace(original, adapted);
}

let adaptedRouterAsset;

const events = [];
const notifications = [];
let notificationSequence = 0;
const pendingRpc = new Map();
const pendingServerRequests = new Map();
const serverRequests = [];
let serverRequestSequence = 0;
let rpcReady;
let appServer;
let appServerVersion = null;
const terminalSessions = new Map();
const workerEvents = [];
let workerEventSequence = 0;
const bridgeLogDirectory = path.join(__dirname, "logs");
const bridgeRequestLogPath = path.join(bridgeLogDirectory, "bridge-request-log.jsonl");
const bridgeStats = {
  startedAt: Date.now(),
  total: 0,
  byCategory: {},
  byKey: {},
  recent: []
};

function recordBridgeTelemetry(eventsToRecord) {
  for (const entry of Array.isArray(eventsToRecord) ? eventsToRecord : []) {
    const category = String(entry.category || "unhandled");
    const kind = String(entry.kind || "unknown");
    const key = String(entry.key || "(unknown)");
    const outcome = String(entry.outcome || "received");
    const safe = {
      at: Number(entry.at) || Date.now(),
      kind: kind.slice(0, 80),
      key: key.slice(0, 180),
      category: category.slice(0, 80),
      outcome: outcome.slice(0, 40),
      status: Number.isInteger(entry.status) ? entry.status : undefined,
      empty: Boolean(entry.empty),
      fields: Array.isArray(entry.fields)
        ? entry.fields.slice(0, 32).map(value => String(value).slice(0, 80))
        : undefined
    };
    bridgeStats.total += outcome === "received" ? 1 : 0;
    const categoryStats = bridgeStats.byCategory[category] ||= {
      count: 0, received: 0, success: 0, errors: 0, empty: 0
    };
    categoryStats.count += outcome === "received" ? 1 : 0;
    categoryStats.received += outcome === "received" ? 1 : 0;
    categoryStats.success += outcome === "success" ? 1 : 0;
    categoryStats.errors += outcome === "error" ? 1 : 0;
    categoryStats.empty += safe.empty ? 1 : 0;
    const keyStats = bridgeStats.byKey[`${category}:${kind}:${key}`] ||= {
      category, kind, key, count: 0, received: 0, success: 0, errors: 0,
      empty: 0, lastAt: 0, fields: []
    };
    keyStats.count += outcome === "received" ? 1 : 0;
    keyStats.received += outcome === "received" ? 1 : 0;
    keyStats.success += outcome === "success" ? 1 : 0;
    keyStats.errors += outcome === "error" ? 1 : 0;
    keyStats.empty += safe.empty ? 1 : 0;
    keyStats.lastAt = safe.at;
    keyStats.fields = [...new Set([...(keyStats.fields || []), ...(safe.fields || [])])].slice(0, 32);
    bridgeStats.recent.push(safe);
    if (bridgeStats.recent.length > 500) bridgeStats.recent.shift();
    fs.mkdirSync(bridgeLogDirectory, { recursive: true });
    fs.appendFile(bridgeRequestLogPath, `${JSON.stringify(safe)}\n`, () => {});
  }
}

function emitWorkerEvent(workerId, event) {
  workerEvents.push({
    seq: ++workerEventSequence,
    workerId,
    event
  });
  if (workerEvents.length > 500) workerEvents.shift();
}

function allowedLocalRoots() {
  return [
    workspaceRoot,
    codexHome,
    ...projects.flatMap((project) => project.rootPaths)
  ].map((value) => {
    try { return fs.realpathSync(value); } catch { return path.resolve(value); }
  });
}

function isClipboardTempPath(candidate) {
  const tempRoot = path.resolve(os.tmpdir());
  return path.dirname(candidate).toLowerCase() === tempRoot.toLowerCase() &&
    /^codex-clipboard-[a-f0-9-]+\.(?:png|jpe?g|gif|webp)$/i.test(path.basename(candidate));
}

function resolveLocalPath(value, { mustExist = false, allowClipboardImage = false } = {}) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("path is required");
  }
  const normalized = /^\/[A-Za-z]:[\\/]/.test(value) ? value.slice(1) : value;
  const candidate = path.resolve(normalized);
  const roots = allowedLocalRoots();
  const existingAncestor = (() => {
    let current = candidate;
    while (!fs.existsSync(current) && path.dirname(current) !== current) current = path.dirname(current);
    return current;
  })();
  const resolvedAncestor = fs.realpathSync(existingAncestor);
  const resolved = path.join(resolvedAncestor, path.relative(existingAncestor, candidate));
  if (!roots.some((rootPath) => isPathWithin(resolved, rootPath)) &&
      !(allowClipboardImage && isClipboardTempPath(resolved))) {
    throw new Error("path is outside the browser reuse workspace");
  }
  if (mustExist && !fs.existsSync(candidate)) {
    throw new Error("path does not exist");
  }
  return resolved;
}

function execFileAsync(file, args, options = {}) {
  return new Promise((resolve, reject) => {
    execFile(file, args, {
      windowsHide: true,
      maxBuffer: 8 * 1024 * 1024,
      ...options
    }, (error, stdout, stderr) => {
      if (error) {
        error.stdout = stdout;
        error.stderr = stderr;
        reject(error);
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}

function gitCwd(params) {
  return resolveLocalPath(
    params?.cwd || params?.root || params?.workspaceRoot || workspaceRoot,
    { mustExist: true }
  );
}

function parseGitStatus(stdout) {
  return stdout.split(/\r?\n/).filter(Boolean).map((line) => ({
    index: line.slice(0, 1),
    worktree: line.slice(1, 2),
    path: line.slice(3)
  }));
}

async function runGitWorker(method, params = {}) {
  const cwd = gitCwd(params);
  const git = async (args) => (await execFileAsync("git", args, { cwd })).stdout.trim();
  let repoRoot = null;
  try { repoRoot = await git(["rev-parse", "--show-toplevel"]); } catch {}
  switch (method) {
    case "availability":
      return { available: repoRoot != null };
    case "config-value": {
      const key = String(params.key || "").trim();
      if (!key) return { value: null };
      const scope = String(params.scope || "local").toLowerCase();
      const scopeArg = {
        local: "--local",
        global: "--global",
        system: "--system",
        worktree: "--worktree"
      }[scope] || "--local";
      try {
        const result = await execFileAsync("git", ["config", scopeArg, "--get", key], { cwd });
        return { value: result.stdout.trim() || null };
      } catch (error) {
        if (error?.code === 1) return { value: null };
        throw error;
      }
    }
    case "watch-repo":
    case "unwatch-repo":
    case "invalidate-git-read-caches":
      return { ok: true, available: repoRoot != null };
    case "status-summary":
      if (!repoRoot) {
        return { cwd, branch: null, files: [], isClean: true, available: false };
      }
      {
        const status = await git(["status", "--porcelain=v1"]);
        return {
          cwd,
          branch: await git(["branch", "--show-current"]).catch(() => ""),
          files: parseGitStatus(status),
          isClean: status === "",
          available: true
        };
      }
    case "stable-metadata":
      if (!repoRoot) throw new Error("not a git repository");
      return {
        cwd,
        root: repoRoot,
        commonDir: await git(["rev-parse", "--git-common-dir"]),
        branch: await git(["branch", "--show-current"]).catch(() => ""),
        isDirty: Boolean(await git(["status", "--porcelain=v1"])),
        available: true
      };
    case "current-branch":
      if (!repoRoot) return { branch: null, available: false };
      return { branch: await git(["branch", "--show-current"]) || null, available: true };
    case "default-branch":
      return { branch: await git(["symbolic-ref", "--short", "refs/remotes/origin/HEAD"]).catch(() => null) };
    case "recent-branches": {
      const branches = await git(["for-each-ref", "--sort=-committerdate", "--format=%(refname:short)", "refs/heads"]);
      return { branches: branches ? branches.split(/\r?\n/).filter(Boolean).slice(0, params.limit || 100) : [] };
    }
    case "base-branch":
      return { branch: await git(["symbolic-ref", "--short", "refs/remotes/origin/HEAD"]).catch(() => null) };
    case "branch-exists": {
      const branch = String(params.branch || params.name || "");
      try {
        await git(["show-ref", "--verify", "--quiet", `refs/heads/${branch}`]);
        return { exists: true, branch };
      } catch {
        return { exists: false, branch };
      }
    }
    case "create-branch": {
      const branch = String(params.branch || params.name || "");
      if (!/^[A-Za-z0-9._/-]+$/.test(branch)) throw new Error("invalid branch name");
      await git(["switch", "-c", branch]);
      return { branch };
    }
    case "branch-commits": {
      const branch = String(params.branch || "HEAD");
      const output = await git(["log", "--format=%H%x09%s%x09%an%x09%aI", "-n", String(params.limit || 50), branch]);
      return {
        commits: output ? output.split(/\r?\n/).filter(Boolean).map((line) => {
          const [hash, subject, author, date] = line.split("\t");
          return { hash, subject, author, date };
        }) : []
      };
    }
    case "review-summary":
    case "review-diff":
    case "branch-diff-stats": {
      const base = params.baseBranch || params.base || "HEAD~1";
      const diff = await git(["diff", "--no-ext-diff", "--stat", base, "HEAD"]).catch(() => "");
      return { baseBranch: base, diff };
    }
    default:
      throw new Error(`unsupported git worker method: ${method}`);
  }
}

function terminalShell(shell) {
  const requested = typeof shell === "string" ? shell.toLowerCase() : "";
  if (requested.includes("cmd")) return { file: process.env.ComSpec || "cmd.exe", args: ["/d", "/q"] };
  if (requested.includes("bash")) return { file: "bash.exe", args: ["--noprofile", "--norc"] };
  if (requested.includes("powershell") || requested.includes("pwsh")) {
    return {
      file: requested.includes("pwsh") ? "pwsh.exe" : "powershell.exe",
      args: ["-NoLogo", "-NoProfile"]
    };
  }
  return {
    file: "powershell.exe",
    args: ["-NoLogo", "-NoProfile"]
  };
}

async function createTerminalSession(params = {}) {
  const sessionId = String(params.sessionId || `browser-terminal-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  const existing = terminalSessions.get(sessionId);
  if (existing) {
    emitWorkerEvent("terminal", {
      type: "attached", sessionId, cwd: existing.cwd, shell: existing.shell
    });
    emitWorkerEvent("terminal", { type: "init-log", sessionId, log: existing.buffer });
    return { sessionId };
  }
  const cwd = resolveLocalPath(params.cwd || params.workspaceRoot || workspaceRoot, { mustExist: true });
  const shell = terminalShell(params.shell);
  const session = { sessionId, cwd, shell: shell.file, buffer: "" };
  terminalSessions.set(sessionId, session);
  try {
    const result = await callAppServer({
      id: randomUUID(),
      method: "process/spawn",
      params: {
        command: [shell.file, ...shell.args],
        processHandle: sessionId,
        cwd,
        tty: true,
        timeoutMs: null,
        outputBytesCap: null,
        size: {
          cols: Math.max(1, Number(params.cols) || 80),
          rows: Math.max(1, Number(params.rows) || 24)
        }
      }
    });
    if (result.error) throw new Error(result.error.message);
  } catch (error) {
    terminalSessions.delete(sessionId);
    throw error;
  }
  emitWorkerEvent("terminal", { type: "attached", sessionId, cwd, shell: shell.file });
  if (session.buffer) emitWorkerEvent("terminal", { type: "init-log", sessionId, log: session.buffer });
  return { sessionId };
}

async function terminalRpc(method, params) {
  const result = await callAppServer({ id: randomUUID(), method, params });
  if (result.error) throw new Error(result.error.message);
  return result.result;
}

function canonicalPath(value) {
  if (!value || typeof value !== "string") return null;
  return path.resolve(value).replace(/[\\/]+$/, "").toLowerCase();
}

function isPathWithin(candidate, rootPath) {
  const relative = path.relative(rootPath, candidate);
  return relative === "" || (relative && !relative.startsWith("..") && !path.isAbsolute(relative));
}

function stripFileReferenceLine(value) {
  const text = String(value || "");
  return text
    .replace(/#L\d+(?:-L\d+)?$/i, "")
    .replace(/:\d+(?:-\d+)?$/, "");
}

function resolveAgentsFile() {
  const resolved = fs.realpathSync(agentsFilePath);
  if (!isPathWithin(resolved, fs.realpathSync(codexHome))) {
    throw new Error("Codex instructions link points outside CODEX_HOME");
  }
  return resolved;
}

function readAgentsFile() {
  const resolved = resolveAgentsFile();
  return {
    path: agentsFilePath,
    contents: fs.readFileSync(resolved, "utf8"),
    hasOverride: fs.existsSync(agentsOverridePath) &&
      fs.statSync(agentsOverridePath).size > 0
  };
}

function readGlobalState() {
  try {
    return JSON.parse(fs.readFileSync(globalStatePath, "utf8"));
  } catch {
    return {};
  }
}

function pinnedThreadIds() {
  // Unlike optional project bootstrap, a failed read must not erase pin state.
  const ids = JSON.parse(fs.readFileSync(globalStatePath, "utf8"))["pinned-thread-ids"];
  return Array.isArray(ids) ? ids.filter(id => typeof id === "string") : [];
}

function setThreadPinned(threadId, pinned) {
  if (typeof threadId !== "string" || !threadId.trim() || typeof pinned !== "boolean") {
    throw new Error("threadId and pinned are required");
  }
  // Re-read immediately before writing so unrelated desktop state stays intact.
  const state = JSON.parse(fs.readFileSync(globalStatePath, "utf8"));
  const ids = Array.isArray(state["pinned-thread-ids"])
    ? state["pinned-thread-ids"].filter(id => typeof id === "string")
    : [];
  state["pinned-thread-ids"] = pinned
    ? [...ids.filter(id => id !== threadId), threadId]
    : ids.filter(id => id !== threadId);
  // Replace atomically; never leave a truncated global-state file on failure.
  const temporary = `${globalStatePath}.${randomUUID()}.tmp`;
  try {
    fs.writeFileSync(temporary, JSON.stringify(state), { encoding: "utf8", flag: "wx" });
    fs.renameSync(temporary, globalStatePath);
  } finally {
    if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
  }
  return state["pinned-thread-ids"];
}

// Every reader, including native notifications, shares the same fresh source.
const desktopSettingStore = createDesktopSettings({
  configPath: configTomlPath,
  sendRequest: request => callAppServer({ ...request, id: `settings-${randomUUID()}` })
});
const readDesktopSettings = desktopSettingStore.read;

function buildProjectState() {
  const state = readGlobalState();
  const rawProjects = state["local-projects"];
  const projectsById = rawProjects && typeof rawProjects === "object"
    ? rawProjects
    : {};
  const order = Array.isArray(state["project-order"])
    ? state["project-order"]
    : Object.keys(projectsById);
  const projects = [];
  const seen = new Set();
  for (const id of [...order, ...Object.keys(projectsById)]) {
    const source = projectsById[id];
    if (seen.has(id) || !source || typeof source !== "object") continue;
    const rootPaths = Array.isArray(source.rootPaths)
      ? source.rootPaths.filter(value => typeof value === "string" && value.length > 0)
      : [];
    if (!rootPaths.length) continue;
    seen.add(id);
    projects.push({
      id,
      name: source.name || path.basename(rootPaths[0]) || rootPaths[0],
      rootPaths,
      defaultCwd: rootPaths[0],
      createdAt: Number(source.createdAt || 0),
      updatedAt: Number(source.updatedAt || 0)
    });
  }
  return {
    projects,
    projectOrder: projects.map(project => project.id),
    selectedProject: state["selected-project"] || null,
    threadAssignments: state["thread-project-assignments"] || {},
    projectlessThreadIds: Array.isArray(state["projectless-thread-ids"])
      ? state["projectless-thread-ids"]
      : [],
    sidebarProjectThreadOrders: state["sidebar-project-thread-orders"] || {}
  };
}

const projectState = buildProjectState();
const projects = projectState.projects;
const projectsById = new Map(projects.map((project) => [project.id, project]));

function projectIdForThread(thread) {
  if (projectState.projectlessThreadIds.includes(thread?.id)) return null;
  const assignment = thread?.id && projectState.threadAssignments[thread.id];
  if (assignment?.projectId && projectsById.has(assignment.projectId)) {
    return assignment.projectId;
  }
  if (thread?.projectId && projectsById.has(thread.projectId)) return thread.projectId;
  const candidates = [
    thread?.cwd,
    thread?.environments?.[0]?.cwd,
    thread?.environments?.[0]?.runtimeWorkspaceRoots?.[0]
  ].map(canonicalPath).filter(Boolean);
  let best = null;
  for (const candidate of candidates) {
    for (const project of projects) {
      const primaryRoot = canonicalPath(project.rootPaths[0]);
      if (primaryRoot && isPathWithin(candidate, primaryRoot) &&
          (!best || primaryRoot.length > best.rootPath.length)) {
        best = { project, rootPath: primaryRoot, primary: true };
      }
    }
    if (best) return best.project.id;
  }
  for (const candidate of candidates) {
    for (const project of projects) {
      const matchingRoot = project.rootPaths
        .slice(1)
        .map(canonicalPath)
        .filter(Boolean)
        .find(rootPath => isPathWithin(candidate, rootPath));
      if (matchingRoot &&
          (!best || (!best.primary && matchingRoot.length > best.rootPath.length))) {
        best = { project, rootPath: matchingRoot, primary: false };
      }
    }
    if (best) return best.project.id;
  }
  return null;
}

function enrichThread(thread) {
  if (!thread || typeof thread !== "object") return thread;
  const projectId = projectIdForThread(thread);
  return projectId && thread.projectId !== projectId
    ? { ...thread, projectId }
    : thread;
}

function enrichAppServerResponse(method, message) {
  if (!message?.result) return message;
  if (Array.isArray(message.result.data) && method === "thread/list") {
    message.result.data.forEach(thread => desktopNotifier.rememberThread(thread));
  }
  if (message.result.thread) desktopNotifier.rememberThread(message.result.thread);
  if (method === "thread/list" && Array.isArray(message.result.data)) {
    return {
      ...message,
      result: { ...message.result, data: message.result.data.map(enrichThread) }
    };
  }
  if (message.result.thread) {
    return {
      ...message,
      result: { ...message.result, thread: enrichThread(message.result.thread) }
    };
  }
  return message;
}

function startAppServer() {
  appServer = spawn(codexExe, ["app-server", "--listen", "stdio://"], {
    cwd: workspaceRoot,
    stdio: ["pipe", "pipe", "pipe"],
    windowsHide: true,
  });
  let buffer = "";
  appServer.stdout.on("data", (chunk) => {
    buffer += chunk.toString();
    for (;;) {
      const newline = buffer.indexOf("\n");
      if (newline < 0) break;
      const line = buffer.slice(0, newline).trim();
      buffer = buffer.slice(newline + 1);
      if (!line) continue;
      let message;
      try { message = JSON.parse(line); } catch { continue; }
      if (message.id != null) {
        const pending = pendingRpc.get(String(message.id));
        if (pending) {
          pendingRpc.delete(String(message.id));
          pending.resolve(enrichAppServerResponse(pending.method, message));
        } else if (message.method) {
          pendingServerRequests.set(String(message.id), message);
          desktopNotifier.onRequest(message);
          serverRequests.push({ seq: ++serverRequestSequence, message });
          if (serverRequests.length > 100) serverRequests.shift();
        }
      } else if (message.method) {
        desktopNotifier.onEvent(message);
        if (message.method === "process/outputDelta") {
          const { processHandle, deltaBase64 } = message.params || {};
          const session = terminalSessions.get(processHandle);
          if (session) {
            const data = Buffer.from(deltaBase64 || "", "base64").toString("utf8");
            session.buffer = (session.buffer + data).slice(-16000);
            emitWorkerEvent("terminal", {
              type: "data", sessionId: processHandle,
              data
            });
          }
        } else if (message.method === "process/exited") {
          const { processHandle, exitCode } = message.params || {};
          if (terminalSessions.delete(processHandle)) {
            emitWorkerEvent("terminal", { type: "exit", sessionId: processHandle, code: exitCode });
          }
        }
        const notificationMessage = message.method === "thread/started" && message.params?.thread
          ? { ...message, params: { ...message.params, thread: enrichThread(message.params.thread) } }
          : message;
        notifications.push({ seq: ++notificationSequence, message: notificationMessage });
        if (notifications.length > 500) notifications.shift();
      }
    }
  });
  appServer.stderr.on("data", (chunk) => {
    events.push({ at: Date.now(), type: "app-server-stderr", text: chunk.toString().slice(0, 1000) });
  });
  appServer.on("exit", (code, signal) => {
    events.push({ at: Date.now(), type: "app-server-exit", code, signal });
    if (rpcReady) rpcReady = null;
  });
  const initializeId = `browser-reuse-init-${Date.now()}`;
  rpcReady = new Promise((resolve, reject) => {
    pendingRpc.set(initializeId, { resolve, reject, method: "initialize" });
    appServer.stdin.write(JSON.stringify({
      id: initializeId,
      method: "initialize",
      params: {
        clientInfo: {
          name: "codex-browser-reuse",
          title: "Codex Browser Reuse",
          version: "0.1.0"
        },
        capabilities: {
          experimentalApi: true
        }
      }
    }) + "\n");
  }).then((message) => {
    // The app-server userAgent starts with the requesting client name, not
    // always "Codex Desktop"; extract the first semantic version anywhere in
    // the value so renderer capability gates remain accurate.
    appServerVersion = message.result?.userAgent
      ?.match(/(?:^|\/)(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)/)?.[1] || null;
    appServer.stdin.write(JSON.stringify({ method: "initialized", params: {} }) + "\n");
  });
  return rpcReady;
}

const appServerParamKeys = {
  "thread/start": new Set([
    "approvalPolicy", "approvalsReviewer", "baseInstructions", "config",
    "cwd", "developerInstructions", "dynamicTools", "environments",
    "ephemeral", "experimentalRawEvents", "historyMode", "model",
    "modelProvider", "multiAgentMode", "permissions", "personality",
    "projectId", "runtimeWorkspaceRoots", "sandbox", "serviceName",
    "serviceTier", "sessionStartSource", "threadSource"
  ]),
  "thread/resume": new Set([
    "approvalPolicy", "approvalsReviewer", "baseInstructions", "config",
    "cwd", "developerInstructions", "excludeTurns", "history",
    "initialTurnsPage", "model", "modelProvider", "permissions",
    "personality", "runtimeWorkspaceRoots", "sandbox", "serviceTier",
    "threadId"
  ]),
  "turn/start": new Set([
    "approvalPolicy", "approvalsReviewer", "clientUserMessageId", "cwd",
    "additionalContext", "collaborationMode", "cyberAccessProgram",
    "disabledPluginIds", "effort", "environments", "input", "model",
    "multiAgentMode", "outputSchema", "permissions", "personality",
    "responsesapiClientMetadata", "runtimeWorkspaceRoots",
    "sandboxPolicy", "serviceTier", "serviceTierForTurn", "summary",
    "threadId", "toolOutput", "turnTrigger"
  ])
};

function normalizeSandboxMode(value) {
  if (typeof value === "string") {
    const normalized = value.replace(/^:/, "");
    if (normalized === "readOnly") return "read-only";
    if (normalized === "workspace") return "workspace-write";
    if (normalized === "workspaceWrite") return "workspace-write";
    if (normalized === "dangerFullAccess") return "danger-full-access";
    if (["read-only", "workspace-write", "danger-full-access"].includes(normalized)) {
      return normalized;
    }
  }
  if (value && typeof value === "object") {
    return normalizeSandboxMode(value.type);
  }
  return null;
}

function normalizeSandboxPolicy(value) {
  if (typeof value === "string") {
    const mode = normalizeSandboxMode(value);
    if (mode === "read-only") return { type: "readOnly", networkAccess: false };
    if (mode === "danger-full-access") return { type: "dangerFullAccess" };
    if (mode === "workspace-write") return { type: "workspaceWrite", networkAccess: false, writableRoots: [] };
    return value;
  }
  if (!value || typeof value !== "object") return value;
  const type = value.type;
  if (type === "read-only" || type === "readOnly") {
    return { type: "readOnly", networkAccess: Boolean(value.networkAccess) };
  }
  if (type === "danger-full-access" || type === "dangerFullAccess") {
    return { type: "dangerFullAccess" };
  }
  if (type === "workspace-write" || type === "workspaceWrite") {
    return {
      type: "workspaceWrite",
      networkAccess: Boolean(value.networkAccess),
      writableRoots: Array.isArray(value.writableRoots)
        ? value.writableRoots
        : Array.isArray(value.writable_roots) ? value.writable_roots : []
    };
  }
  return value;
}

function adaptAppServerRequest(request) {
  if (!request || !appServerParamKeys[request.method] || !request.params) {
    return request;
  }
  const allowed = appServerParamKeys[request.method];
  const source = request.params;
  const params = {};
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      params[key] = source[key];
    }
  }

  if (request.method === "thread/start" || request.method === "thread/resume") {
    const sandbox = normalizeSandboxMode(source.sandbox) ||
      normalizeSandboxMode(source.sandboxPolicy);
    if (sandbox) params.sandbox = sandbox;
    // Local project IDs belong to the browser's project-assignment layer.
    // The CLI app-server only accepts project IDs from its own project store;
    // forwarding our synthetic ID makes thread/start fail with "project not found".
    if (request.method === "thread/start" &&
        source.projectId && projectsById.has(source.projectId)) {
      delete params.projectId;
    }
    // A projectless thread still needs a real writable cwd for the CLI
    // app-server to create its output directory and thread state.
    if (request.method === "thread/start" && !params.cwd && !source.projectId) {
      params.cwd = workspaceRoot;
    }
    delete params.sandboxPolicy;
    // The local CLI owns provider selection; only remove the desktop provider
    // and host-tool overlay. Keep the renderer's CLI feature flags, especially
    // request_permissions_tool paired with the granular approval policy.
    if (source.modelProvider === "codex_vscode_copilot") {
      delete params.modelProvider;
      if (params.config && typeof params.config === "object") {
        params.config = Object.fromEntries(Object.entries(params.config).filter(([key]) =>
          key !== "model_provider" &&
          key !== "model_providers.codex_vscode_copilot" &&
          !key.startsWith("model_providers.codex_vscode_copilot.") &&
          !key.startsWith("plugins.codex-app-tools@openai-bundled.")));
      }
    }
  } else if (request.method === "turn/start") {
    if (source.sandboxPolicy != null) {
      params.sandboxPolicy = normalizeSandboxPolicy(source.sandboxPolicy);
    } else if (source.sandbox != null) {
      // `permissions` is a named profile such as `:workspace`, not a
      // sandbox mode. Treating it as one creates the invalid combination
      // `{ permissions, sandboxPolicy }` rejected by app-server.
      const mode = normalizeSandboxMode(source.sandbox);
      if (mode) {
        params.sandboxPolicy = normalizeSandboxPolicy(mode);
      }
    }
  }

  return { ...request, params };
}

async function callAppServer(request) {
  await (rpcReady || startAppServer());
  const adaptedRequest = adaptAppServerRequest(request);
  if (JSON.stringify(adaptedRequest) !== JSON.stringify(request)) {
    events.push({
      at: Date.now(),
      type: "app-server-request-adapted",
      method: request.method,
      removedKeys: Object.keys(request.params || {}).filter(
        (key) => !Object.prototype.hasOwnProperty.call(adaptedRequest.params || {}, key)
      )
    });
  }
  return new Promise((resolve, reject) => {
    const id = String(adaptedRequest.id);
    pendingRpc.set(id, { resolve, reject, method: adaptedRequest.method });
    const timer = setTimeout(() => {
      pendingRpc.delete(id);
      reject(new Error(`app-server request timed out: ${adaptedRequest.method}`));
    }, 120000);
    const pending = pendingRpc.get(id);
    const originalResolve = pending.resolve;
    pending.resolve = (message) => {
      clearTimeout(timer);
      // This build has no browser container or model browser-control
      // service, so do not expose desktop browser capabilities from the
      // installed app-server to the web renderer.
      if (!message?.error && adaptedRequest.method === "config/read") {
        const config = message.result?.config;
        if (config && typeof config === "object") {
          config.in_app_browser = false;
          config.browser_use = false;
        }
      }
      if (!message?.error && adaptedRequest.method === "experimentalFeature/list") {
        const data = message.result?.data;
        if (Array.isArray(data)) {
          for (const feature of data) {
            if (feature?.name === "in_app_browser" || feature?.name === "browser_use") {
              feature.enabled = false;
            }
          }
        }
      }
      if (message?.error) {
        events.push({
          at: Date.now(),
          type: "app-server-response-error",
          method: adaptedRequest.method,
          code: message.error.code,
          text: message.error.message
        });
      }
      originalResolve(message);
    };
    appServer.stdin.write(JSON.stringify(adaptedRequest) + "\n");
  });
}

// CLI events own the notification lifecycle, even with no renderer connected.
const desktopNotifier = createDesktopNotifications({
  port,
  basePath: deployment.basePath,
  soundDirectory: path.dirname(codexExe),
  readSettings: readDesktopSettings,
  getPending: id => id == null ? null : pendingServerRequests.get(String(id)),
  respond: (id, result) => writeServerResponse({ id, result }),
  log: entry => {
    events.push({ ...entry, type: `desktop-notification-${entry.type}` });
    try {
      fs.mkdirSync(bridgeLogDirectory, { recursive: true });
      fs.appendFileSync(path.join(bridgeLogDirectory, "desktop-notifications.jsonl"),
        JSON.stringify(entry) + "\n");
    } catch (error) { console.error("Notification log failed:", error.message); }
  }
});

function writeServerResponse(message) {
  const pending = pendingServerRequests.get(String(message.id));
  if (!pending) throw new Error("unknown app-server request");
  if (!appServer || appServer.killed || !appServer.stdin.writable) {
    throw new Error("app-server is not connected");
  }
  // Preserve the request's id type and original response shape, including id 0.
  appServer.stdin.write(JSON.stringify({ ...message, id: pending.id }) + "\n");
  pendingServerRequests.delete(String(pending.id));
}

startAppServer().catch((error) => {
  events.push({ at: Date.now(), type: "app-server-init-error", text: String(error) });
});

// Desktop-owned queue coordination is backend-owned here, shared across clients.
const handleQueuedFollowUpSendLock = createQueuedFollowUpSendLockHandler();
const server = http.createServer(async (request, response) => {
  // Network and authentication checks must precede every bridge or renderer route.
  if (!await allowRequest(request, response)) return;
  const url = new URL(request.url, `http://127.0.0.1:${port}`);
  // The guard accepts only mounted paths; handlers continue using internal routes.
  const internalPath = deployment.internalPath(url.pathname);
  if (internalPath === null) { response.writeHead(404); response.end(); return; }
  url.pathname = internalPath;
  const isLan = !isLoopback(request.socket.remoteAddress);
  if (handleQueuedFollowUpSendLock(request, response, url.pathname)) return;
  if (url.pathname.startsWith("/__extensions/")) {
    try {
      const config = readExtensionsConfig();
      const asset = extensionAssets[url.pathname];
      const sticker = /^\/__extensions\/themes\/nahida\/stickers\/sticker-0[1-9]\.webp$/.test(url.pathname);
      if (request.method !== "GET" && request.method !== "HEAD" ||
          !asset && !sticker ||
          asset && !config[asset[0]][asset[1]] ||
          sticker && !config.themes.nahida) {
        response.writeHead(404); response.end(); return;
      }
      const source = sticker
        ? path.join(extensionsRoot, "themes/nahida/stickers", path.basename(url.pathname))
        : path.join(extensionsRoot, asset[2]);
      // Keep sticker bytes binary; only the generated theme stylesheet is text.
      const content = url.pathname.endsWith("/theme.css")
        ? nahidaCss()
        : fs.readFileSync(source);
      response.writeHead(200, {
        "content-type": mime[path.extname(source)],
        "cache-control": "no-store"
      });
      response.end(request.method === "HEAD" ? undefined : content);
    } catch (error) {
      console.error("Extension asset failed:", error);
      response.writeHead(500); response.end("Extension asset failed");
    }
    return;
  }
  if (url.pathname === "/__bridge/status") {
    response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({
      appServer: appServer && !appServer.killed ? "running" : "stopped",
      appServerVersion,
      codexExe,
      workspaceRoot,
      notificationSequence
    }));
    return;
  }
  if (url.pathname === "/__bridge/stats" && request.method === "GET") {
    response.writeHead(200, {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    });
    response.end(JSON.stringify({
      ...bridgeStats,
      logPath: bridgeRequestLogPath,
      categories: [
        "real-forward", "local-bridge", "example-fallback",
        "empty-fallback", "unhandled", "error"
      ]
    }));
    return;
  }
  if (url.pathname === "/__bridge/pinned-threads" && request.method === "GET") {
    try {
      const threadIds = pinnedThreadIds();
      response.writeHead(200, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
      response.end(JSON.stringify({ threadIds, serverOrderedThreadIds: [] }));
    } catch (error) {
      response.writeHead(500, { "content-type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ error: String(error?.message || error) }));
    }
    return;
  }
  if (url.pathname === "/__bridge/pinned-threads" && request.method === "POST") {
    let body = "";
    request.on("data", chunk => {
      body += chunk;
      if (body.length > 4096) request.destroy();
    });
    request.on("end", () => {
      try {
        const { threadId, pinned } = JSON.parse(body || "{}");
        setThreadPinned(threadId, pinned);
        response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
        response.end(JSON.stringify({ success: true }));
      } catch (error) {
        response.writeHead(400, { "content-type": "application/json; charset=utf-8" });
        response.end(JSON.stringify({ error: String(error?.message || error) }));
      }
    });
    return;
  }
  if (url.pathname === "/__bridge/stats/reset" && request.method === "POST") {
    bridgeStats.startedAt = Date.now();
    bridgeStats.total = 0;
    bridgeStats.byCategory = {};
    bridgeStats.byKey = {};
    bridgeStats.recent = [];
    try { fs.rmSync(bridgeRequestLogPath, { force: true }); } catch {}
    response.writeHead(204);
    response.end();
    return;
  }
  if (url.pathname === "/__bridge/telemetry" && request.method === "POST") {
    let body = "";
    request.on("data", chunk => {
      body += chunk;
      if (body.length > 512 * 1024) request.destroy();
    });
    request.on("end", () => {
      try {
        const payload = JSON.parse(body || "{}");
        recordBridgeTelemetry(payload.events);
        response.writeHead(204);
        response.end();
      } catch (error) {
        response.writeHead(400, { "content-type": "application/json; charset=utf-8" });
        response.end(JSON.stringify({ error: String(error?.message || error) }));
      }
    });
    return;
  }
  if (url.pathname === "/__bridge/settings" && request.method === "GET") {
    try {
      const values = readDesktopSettings();
      response.writeHead(200, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
      response.end(JSON.stringify(values));
    } catch (error) {
      response.writeHead(500, { "content-type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ error: String(error.message) }));
    }
    return;
  }
  if (url.pathname === "/__bridge/agents" && request.method === "GET") {
    try {
      response.writeHead(200, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
      response.end(JSON.stringify(readAgentsFile()));
    } catch (error) {
      response.writeHead(500, { "content-type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ error: String(error?.message || error) }));
    }
    return;
  }
  if (url.pathname === "/__bridge/agents" && request.method === "POST") {
    let body = "";
    request.on("data", chunk => {
      body += chunk;
      if (body.length > 1024 * 1024) request.destroy();
    });
    request.on("end", () => {
      try {
        const { contents } = JSON.parse(body || "{}");
        if (typeof contents !== "string") throw new Error("contents must be a string");
        const resolved = resolveAgentsFile();
        fs.writeFileSync(resolved, contents, "utf8");
        response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
        response.end(JSON.stringify(readAgentsFile()));
      } catch (error) {
        response.writeHead(400, { "content-type": "application/json; charset=utf-8" });
        response.end(JSON.stringify({ error: String(error?.message || error) }));
      }
    });
    return;
  }
  if (url.pathname === "/__bridge/settings" && request.method === "POST") {
    let body = "";
    request.on("data", chunk => { body += chunk; });
    request.on("end", async () => {
      try {
        const payload = JSON.parse(body || "{}");
        const values = payload.values || payload.settings || payload;
        const updated = await desktopSettingStore.write(values);
        response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
        response.end(JSON.stringify(updated));
      } catch (error) {
        response.writeHead(400, { "content-type": "application/json; charset=utf-8" });
        response.end(JSON.stringify({ error: String(error?.message || error) }));
      }
    });
    return;
  }
  if (url.pathname === "/__bridge/worker-events") {
    const after = Number(url.searchParams.get("after") || 0);
    response.writeHead(200, {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    });
    response.end(JSON.stringify({
      events: workerEvents.filter((entry) => entry.seq > after),
      cursor: workerEventSequence
    }));
    return;
  }
  if (url.pathname === "/__bridge/local-image" && request.method === "GET") {
    try {
      const target = resolveLocalPath(url.searchParams.get("path"), {
        mustExist: true, allowClipboardImage: true
      });
      const extension = path.extname(target).toLowerCase();
      const contentType = mime[extension];
      if (!contentType?.startsWith("image/")) throw new Error("not an image");
      const stat = fs.statSync(target);
      if (!stat.isFile() || stat.size > 16 * 1024 * 1024) throw new Error("image unavailable");
      response.writeHead(200, { "content-type": contentType, "cache-control": "no-store" });
      fs.createReadStream(target).pipe(response);
    } catch (error) {
      response.writeHead(404);
      response.end();
    }
    return;
  }
  if (url.pathname === "/__bridge/local-file" && request.method === "GET") {
    try {
      const download = url.searchParams.get("download") === "1";
      const target = resolveLocalPath(
        stripFileReferenceLine(url.searchParams.get("path")),
        { mustExist: true }
      );
      const stat = fs.statSync(target);
      if (!stat.isFile() || (!download && stat.size > 16 * 1024 * 1024)) {
        throw new Error("file unavailable");
      }
      const extension = path.extname(target).toLowerCase();
      const contentType = download ? "application/octet-stream" : mime[extension] ||
        ([".txt", ".md", ".py", ".rs", ".ts", ".tsx", ".jsx", ".cpp", ".h", ".hpp", ".toml", ".yaml", ".yml", ".log"].includes(extension)
          ? "text/plain; charset=utf-8" : "application/octet-stream");
      response.writeHead(200, {
        "content-type": contentType,
        // The browser owns the save dialog; RFC 5987 preserves non-ASCII filenames.
        "content-disposition": download
          ? `attachment; filename*=UTF-8''${encodeURIComponent(path.basename(target))}`
          : "inline",
        "x-content-type-options": "nosniff",
        "cache-control": "no-store"
      });
      fs.createReadStream(target).pipe(response);
    } catch {
      response.writeHead(404);
      response.end();
    }
    return;
  }
  if (url.pathname === "/__bridge/worker" && request.method === "POST") {
    let body = "";
    request.on("data", (chunk) => { body += chunk; });
    request.on("end", async () => {
      try {
        const payload = JSON.parse(body || "{}");
        const workerId = payload.workerId || payload.name;
        const workerRequest = payload.request || {};
        let value;
        if (workerId === "git") {
          value = await runGitWorker(workerRequest.method, workerRequest.params);
        } else if (workerId === "terminal") {
          const params = workerRequest.params || {};
          switch (workerRequest.method) {
            case "create":
              value = await createTerminalSession(params);
              break;
            case "attach":
            case "attachExisting": {
              const session = terminalSessions.get(String(params.sessionId));
              if (!session && workerRequest.method === "attach") {
                value = await createTerminalSession(params);
              } else {
                if (session) {
                  emitWorkerEvent("terminal", {
                    type: "attached", sessionId: session.sessionId,
                    cwd: session.cwd, shell: session.shell
                  });
                  emitWorkerEvent("terminal", {
                    type: "init-log", sessionId: session.sessionId, log: session.buffer
                  });
                }
                value = { attached: Boolean(session) };
              }
              break;
            }
            case "write": {
              const session = terminalSessions.get(String(params.sessionId));
              if (!session) throw new Error("terminal session not found");
              await terminalRpc("process/writeStdin", {
                processHandle: session.sessionId,
                deltaBase64: Buffer.from(String(params.data ?? "")).toString("base64")
              });
              value = { ok: true };
              break;
            }
            case "resize":
              if (terminalSessions.has(String(params.sessionId))) {
                await terminalRpc("process/resizePty", {
                  processHandle: String(params.sessionId),
                  size: { cols: Math.max(1, Number(params.cols) || 80), rows: Math.max(1, Number(params.rows) || 24) }
                });
              }
              value = { ok: true, cols: params.cols, rows: params.rows };
              break;
            case "getShellCwd":
              value = terminalSessions.get(String(params.sessionId))?.cwd || null;
              break;
            case "runAction": {
              const session = terminalSessions.get(String(params.sessionId));
              if (!session) throw new Error("terminal session not found");
              const command = Array.isArray(params.command)
                ? params.command.join(" ")
                : String(params.command || "");
              await terminalRpc("process/writeStdin", {
                processHandle: session.sessionId,
                deltaBase64: Buffer.from(command + "\r").toString("base64")
              });
              value = { ok: true };
              break;
            }
            case "close": {
              const session = terminalSessions.get(String(params.sessionId));
              if (session) {
                await terminalRpc("process/kill", { processHandle: session.sessionId });
                terminalSessions.delete(session.sessionId);
              }
              value = { ok: true };
              break;
            }
            default:
              throw new Error(`unsupported terminal method: ${workerRequest.method}`);
          }
        } else if (workerId === "computer-use") {
          value = { available: false, reason: "browser reuse does not expose native computer use" };
        } else {
          throw new Error(`unsupported worker: ${workerId}`);
        }
        response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
        response.end(JSON.stringify({ type: "ok", value }));
      } catch (error) {
        response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
        response.end(JSON.stringify({
          type: "error",
          error: { message: String(error?.message || error) }
        }));
      }
    });
    return;
  }
  if (url.pathname === "/__bridge/files" && request.method === "POST") {
    let body = "";
    request.on("data", (chunk) => { body += chunk; });
    request.on("end", () => {
      try {
        const payload = JSON.parse(body || "{}");
        const operation = payload.operation || "stat";
        const target = resolveLocalPath(payload.path, { mustExist: true });
        if (operation === "metadata") {
          const stat = fs.statSync(target);
          let contentKind = null;
          if (stat.isFile()) {
            const extension = path.extname(target).toLowerCase();
            if ([".png", ".jpg", ".jpeg", ".webp", ".gif"].includes(extension)) {
              contentKind = "image";
            } else if (extension === ".pdf") {
              contentKind = "pdf";
            } else {
              const sample = Buffer.alloc(Math.min(stat.size, payload.contentSampleByteLimit || 4096));
              const fd = fs.openSync(target, "r");
              try { fs.readSync(fd, sample, 0, sample.length, 0); } finally { fs.closeSync(fd); }
              try {
                if (sample.includes(0)) throw new Error("binary");
                new TextDecoder("utf-8", { fatal: true }).decode(sample);
                contentKind = "text";
              } catch { contentKind = "binary"; }
            }
          }
          response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
          response.end(JSON.stringify({
            isFile: stat.isFile(), isDirectory: stat.isDirectory(), contentKind,
            mtimeMs: stat.mtimeMs, sizeBytes: stat.size
          }));
          return;
        }
        if (operation === "read") {
          const stat = fs.statSync(target);
          if (!stat.isFile()) throw new Error("path is not a file");
          if (stat.size > 16 * 1024 * 1024) throw new Error("file is too large to read in browser");
          const bytes = fs.readFileSync(target);
          response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
          response.end(JSON.stringify({
            path: target,
            name: path.basename(target),
            size: stat.size,
            mtimeMs: stat.mtimeMs,
            content: bytes.toString("utf8"),
            dataBase64: payload.representation === "base64" ? bytes.toString("base64") : undefined
          }));
          return;
        }
        if (operation === "list") {
          if (!fs.statSync(target).isDirectory()) throw new Error("path is not a directory");
          const entries = fs.readdirSync(target, { withFileTypes: true })
            .slice(0, 2000)
            .map((entry) => {
              const entryPath = path.join(target, entry.name);
              let size = null;
              try { size = fs.statSync(entryPath).size; } catch {}
              return { name: entry.name, path: entryPath, kind: entry.isDirectory() ? "directory" : "file", size };
            });
          response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
          response.end(JSON.stringify({ path: target, entries }));
          return;
        }
        const stat = fs.statSync(target);
        response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
        response.end(JSON.stringify({
          path: target,
          name: path.basename(target),
          kind: stat.isDirectory() ? "directory" : "file",
          size: stat.size,
          modifiedAt: stat.mtimeMs
        }));
      } catch (error) {
        response.writeHead(400, { "content-type": "application/json; charset=utf-8" });
        response.end(JSON.stringify({ error: String(error?.message || error) }));
      }
    });
    return;
  }
  if ((url.pathname === "/__bridge/image-attachment" ||
       url.pathname === "/__bridge/file-attachment") && request.method === "POST") {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 24 * 1024 * 1024) request.destroy();
    });
    request.on("end", () => {
      try {
        const { dataBase64, mimeType, fileName } = JSON.parse(body || "{}");
        const imageOnly = url.pathname === "/__bridge/image-attachment";
        const extension = {
          "image/png": "png",
          "image/jpeg": "jpg",
          "image/gif": "gif",
          "image/webp": "webp"
        }[mimeType];
        if ((imageOnly && !extension) || typeof dataBase64 !== "string" ||
            !/^[A-Za-z0-9+/]*={0,2}$/.test(dataBase64)) {
          throw new Error("unsupported attachment");
        }
        const bytes = Buffer.from(dataBase64, "base64");
        if (bytes.length > 16 * 1024 * 1024) throw new Error("attachment is too large");
        const directory = path.join(codexHome, "attachments", "browser-reuse");
        fs.mkdirSync(directory, { recursive: true });
        const safeName = typeof fileName === "string"
          ? path.basename(fileName).replace(/[<>:"/\\|?*\x00-\x1f]/g, "_").slice(0, 120)
          : "";
        if (!imageOnly && !safeName) throw new Error("file name is required");
        const filePath = path.join(directory, `${randomUUID()}-${imageOnly ? `image.${extension}` : safeName}`);
        fs.writeFileSync(filePath, bytes, { flag: "wx" });
        response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
        response.end(JSON.stringify({ path: filePath }));
      } catch (error) {
        response.writeHead(400, { "content-type": "application/json; charset=utf-8" });
        response.end(JSON.stringify({ error: String(error?.message || error) }));
      }
    });
    return;
  }
  if (url.pathname === "/__bridge/notifications/show" && request.method === "POST") {
    let body = "";
    request.on("data", chunk => { body += chunk; });
    request.on("end", async () => {
      try {
        const payload = JSON.parse(body || "{}");
        if (!payload.title && !payload.body) {
          throw new Error("notification title or body is required");
        }
        // Official renderer notifications converge on the same deduplicated
        // registry as CLI events. There is only one Windows notification owner.
        const result = await desktopNotifier.publish(payload);
        response.writeHead(200, {
          "content-type": "application/json; charset=utf-8",
          "cache-control": "no-store"
        });
        response.end(JSON.stringify(result));
      } catch (error) {
        response.writeHead(500, { "content-type": "application/json; charset=utf-8" });
        response.end(JSON.stringify({
          shown: false,
          error: String(error?.message || error)
        }));
      }
    });
    return;
  }
  if (url.pathname === "/__bridge/notifications/hide" && request.method === "POST") {
    let body = "";
    request.on("data", chunk => { body += chunk; });
    request.on("end", async () => {
      try {
        const payload = JSON.parse(body || "{}");
        const result = await desktopNotifier.hide(payload);
        response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
        response.end(JSON.stringify(result));
      } catch (error) {
        response.writeHead(500, { "content-type": "application/json; charset=utf-8" });
        response.end(JSON.stringify({
          hidden: false,
          error: String(error?.message || error)
        }));
      }
    });
    return;
  }
  if (url.pathname === "/__bridge/notifications/status" && request.method === "GET") {
    response.writeHead(200, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
    response.end(JSON.stringify(desktopNotifier.status()));
    return;
  }
  if ((url.pathname === "/__bridge/notifications/activate" ||
       url.pathname === "/__bridge/notifications/presence") && request.method === "POST") {
    // Native activation is loopback-only. A LAN page may report presence,
    // but cannot execute an approval action through the notification adapter.
    if (isLan && url.pathname.endsWith("/activate")) {
      response.writeHead(403); response.end(); return;
    }
    let body = "";
    request.on("data", chunk => { body += chunk; if (body.length > 65536) request.destroy(); });
    request.on("end", async () => {
      try {
        const payload = JSON.parse(body);
        let result = {};
        if (url.pathname.endsWith("/presence")) desktopNotifier.presence(payload);
        else {
          result = await desktopNotifier.action(payload);
          if (result.reply) {
            const reply = await callAppServer({
              id: `notification-reply-${randomUUID()}`, method: "turn/start",
              params: { threadId: result.threadId, input: [{ type: "text", text: result.reply }] }
            });
            if (reply.error) throw new Error(reply.error.message);
            delete result.reply;
          }
        }
        response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
        response.end(JSON.stringify(result));
      } catch (error) {
        response.writeHead(400, { "content-type": "application/json; charset=utf-8" });
        response.end(JSON.stringify({ error: error.message }));
      }
    });
    return;
  }
  if (url.pathname === "/__bridge/notifications") {
    const after = Number(url.searchParams.get("after") || 0);
    response.writeHead(200, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
    response.end(JSON.stringify({
      notifications: notifications.filter((entry) => entry.seq > after),
      cursor: notificationSequence
    }));
    return;
  }
  if (url.pathname === "/__bridge/requests") {
    const after = Number(url.searchParams.get("after") || 0);
    response.writeHead(200, {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    });
    response.end(JSON.stringify({
      requests: serverRequests.filter(entry => entry.seq > after &&
        pendingServerRequests.has(String(entry.message.id))),
      cursor: serverRequestSequence
    }));
    return;
  }
  if (url.pathname === "/__bridge/rpc-response" && request.method === "POST") {
    let body = "";
    request.on("data", chunk => { body += chunk; });
    request.on("end", () => {
      try {
        const payload = JSON.parse(body || "{}");
        const message = payload.response || payload.message || payload;
        const id = message?.id == null ? null : String(message.id);
        if (!id || !pendingServerRequests.has(id)) {
          response.writeHead(404, { "content-type": "application/json; charset=utf-8" });
          response.end(JSON.stringify({ error: "unknown app-server request" }));
          return;
        }
        writeServerResponse(message);
        response.writeHead(204);
        response.end();
      } catch (error) {
        response.writeHead(400, { "content-type": "application/json; charset=utf-8" });
        response.end(JSON.stringify({ error: String(error?.message || error) }));
      }
    });
    return;
  }
  if (url.pathname === "/__bridge/rpc" && request.method === "POST") {
    let body = "";
    request.on("data", (chunk) => { body += chunk; });
    request.on("end", async () => {
      try {
        const message = JSON.parse(body);
      const rpcMessage = await callAppServer(message.request);
        response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
        response.end(JSON.stringify({
          hostId: message.hostId || "local",
          message: rpcMessage
        }));
      } catch (error) {
        response.writeHead(500, { "content-type": "application/json; charset=utf-8" });
        response.end(JSON.stringify({ error: String(error?.message || error) }));
      }
    });
    return;
  }
  const browserAssets = {
    "/__bridge/browser-paths.js": "browser-paths.js",
    "/__bridge/bridge.js": "bridge.js",
    "/__bridge/browser-viewport.js": "browser-viewport.js",
    "/__bridge/browser-viewport.css": "browser-viewport.css",
    "/__bridge/browser-panel-policy.js": "browser-panel-policy.js"
  };
  if (Object.hasOwn(browserAssets, url.pathname)) {
    const asset = browserAssets[url.pathname];
    // Only explicit compatibility assets are served from the project directory.
    response.writeHead(200, { "content-type": mime[path.extname(asset)], "cache-control": "no-store" });
    response.end(deployment.rewriteResources(fs.readFileSync(path.join(__dirname, asset), "utf8")));
    return;
  }
  if (url.pathname === "/__bridge/events") {
    response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    response.end(JSON.stringify(events.slice(-100)));
    return;
  }
  if (url.pathname === "/__bridge/open-file-manager" && request.method === "POST") {
    let body = "";
    request.on("data", (chunk) => { body += chunk; });
    request.on("end", async () => {
      try {
        const payload = JSON.parse(body || "{}");
        const target = resolveLocalPath(
          stripFileReferenceLine(payload.path),
          { mustExist: true }
        );
        const stat = fs.statSync(target);
        if (!stat.isFile()) throw new Error("target is not a file");
        if (process.platform !== "win32") throw new Error("file manager is only implemented on Windows");
        // Explorer usually hands the request to an existing shell process
        // and may return a non-zero exit code even after opening the folder.
        // Detach it instead of treating that shell handoff as a failure.
        const child = spawn("explorer.exe", [`/select,${target}`], {
          detached: true,
          stdio: "ignore",
          windowsHide: false
        });
        child.unref();
        // Explorer hands the request to another process. Wait for the shell
        // window and focus the one whose selection matches this exact file.
        await execFileAsync("powershell.exe", [
          "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass",
          "-File", path.join(__dirname, "focus-explorer.ps1"), target
        ]);
        response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
        response.end(JSON.stringify({ success: true }));
      } catch (error) {
        response.writeHead(400, { "content-type": "application/json; charset=utf-8" });
        response.end(JSON.stringify({ success: false, error: String(error?.message || error) }));
      }
    });
    return;
  }
  if (url.pathname === "/__bridge/message" && request.method === "POST") {
    let body = "";
    request.on("data", (chunk) => { body += chunk; });
    request.on("end", () => {
      try {
        const message = JSON.parse(body);
        events.push({ at: Date.now(), type: message?.type ?? "(unknown)" });
        if (events.length > 200) events.shift();
      } catch {}
      response.writeHead(204);
      response.end();
    });
    return;
  }
  const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
  let decoded;
  try { decoded = decodeURIComponent(pathname); } catch {
    response.writeHead(400); response.end(); return;
  }
  let file = path.resolve(root, `.${decoded}`);
  if (path.extname(decoded) === "") {
    file = path.join(root, "index.html");
  }
  if (file !== root && !file.startsWith(root + path.sep)) {
    response.writeHead(403); response.end(); return;
  }
  fs.stat(file, (error, stat) => {
    if (error || !stat.isFile()) {
      response.writeHead(404); response.end(); return;
    }
    if (path.extname(file) !== ".html") {
      if (path.basename(file) === "app-initial-fc9a33fdda88.js") {
        try {
          adaptedRouterAsset ??= deployment.rewriteResources(
            adaptRightPanel(adaptBrowserRouter(fs.readFileSync(file, "utf8"))));
          response.writeHead(200, { "content-type": mime[".js"], "cache-control": "no-store" });
          response.end(adaptedRouterAsset);
        } catch (routerError) {
          console.error(routerError);
          response.writeHead(500); response.end();
        }
        return;
      }
      // Relative module imports stay intact; root resource literals follow the mount.
      if (deployment.prefix && [".js", ".css", ".mjs"].includes(path.extname(file))) {
        response.writeHead(200, { "content-type": mime[path.extname(file)] });
        response.end(deployment.rewriteResources(fs.readFileSync(file, "utf8")));
        return;
      }
      response.writeHead(200, { "content-type": mime[path.extname(file)] || "application/octet-stream" });
      fs.createReadStream(file).pipe(response);
      return;
    }
    fs.readFile(file, "utf8", (readError, html) => {
      if (readError) { response.writeHead(500); response.end(); return; }
      let extensions;
      try {
        const config = readExtensionsConfig();
        extensions = [
          config.plugins["sidebar-touch-scroll"] &&
            '<script src="/__extensions/plugins/sidebar-touch-scroll.js"></script>',
          config.plugins["sidebar-performance"] &&
            '<script src="/__extensions/plugins/sidebar-performance.js"></script>',
          config.themes.nahida &&
            '<script src="/__extensions/themes/nahida/runtime.js"></script>'
        ].filter(Boolean).join("");
      } catch (error) {
        console.error("Extension configuration failed:", error);
        response.writeHead(500); response.end("Extension configuration failed"); return;
      }
      // The packaged CSP is for app://. Keep the source unchanged, but use
      // a localhost-only policy so its existing modules can load here.
      html = html.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/i, "");
      // The packaged assets are relative to index.html, including on deep links.
      html = html.replace("<head>", `<head><base href="${deployment.basePath}">`);
      // Only the initial declaration is fixed; runtime locale changes are
      // intentionally still owned by the official renderer.
      html = html.replace('<html lang="en"', '<html lang="zh-CN"');
      // Supported mobile browsers resize the layout for the keyboard. The
      // visualViewport adapter also covers browsers that only resize its view.
      html = html.replace(/(<meta name="viewport" content=")([^"]+)(")/,
        '$1$2, interactive-widget=resizes-content$3');
      const projectJson = JSON.stringify(projects).replace(/</g, "\\u003c");
      const selectedProjectJson = JSON.stringify(projectState.selectedProject).replace(/</g, "\\u003c");
      const assignmentJson = JSON.stringify(projectState.threadAssignments).replace(/</g, "\\u003c");
      const projectlessJson = JSON.stringify(projectState.projectlessThreadIds).replace(/</g, "\\u003c");
      const projectOrderJson = JSON.stringify(projectState.projectOrder).replace(/</g, "\\u003c");
      const sidebarOrderJson = JSON.stringify(projectState.sidebarProjectThreadOrders).replace(/</g, "\\u003c");
      const desktopSettingsJson = JSON.stringify(readDesktopSettings()).replace(/</g, "\\u003c");
      html = html.replace("</head>", `<link rel="stylesheet" href="/__bridge/browser-viewport.css"><script>window.__codexBrowserBasePath=${JSON.stringify(deployment.basePath)};window.__codexBrowserCsrfToken=${JSON.stringify(request.lanCsrfToken || "")};</script><script src="/__bridge/browser-paths.js"></script><script src="/__bridge/browser-viewport.js"></script><script src="/__bridge/browser-panel-policy.js"></script><script>window.__codexBrowserWorkspaceRoot=${JSON.stringify(workspaceRoot)};window.__codexBrowserCodexHome=${JSON.stringify(codexHome)};window.__codexBrowserProjects=${projectJson};window.__codexBrowserSelectedProject=${selectedProjectJson};window.__codexBrowserThreadAssignments=${assignmentJson};window.__codexBrowserProjectlessThreadIds=${projectlessJson};window.__codexBrowserProjectOrder=${projectOrderJson};window.__codexBrowserSidebarProjectThreadOrders=${sidebarOrderJson};window.__codexBrowserDesktopSettings=${desktopSettingsJson};</script>${extensions}<script src="/__bridge/bridge.js"></script></head>`);
      html = deployment.rewriteResources(html);
      response.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
      response.end(html);
    });
  });
});

// A single IPv4 listener follows LAN address changes while the guard protects access.
server.listen(port, "0.0.0.0", () => {
  console.log(`Codex renderer experiment: http://127.0.0.1:${port}${deployment.basePath}`);
  console.log(`Codex app-server: ${codexExe}`);
  console.log(`Codex listener: 0.0.0.0:${port}; LAN requires session login`);
  console.log(process.env.CODEX_BROWSER_LAN_PASSWORD !== undefined
    ? "LAN credentials: environment override"
    : `LAN credentials file: ${lanCredentialsFile}`);
});

process.on("exit", () => {
  desktopNotifier.close();
  appServer?.kill();
});
