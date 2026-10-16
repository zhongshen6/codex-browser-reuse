const fs = require("node:fs");
const path = require("node:path");
const { fork, execFile } = require("node:child_process");
const { randomUUID } = require("node:crypto");
const { promisify } = require("node:util");

const execFileAsync = promisify(execFile);
// Keep lifecycle endpoints separate from CLI RPC and model-visible capabilities.
const CONTROL_ROOT = "/__bridge/backend/";

function startRestartWorker({ projectRoot, port, backendPid, codexExe, spawnWorker = fork }) {
  return new Promise((resolve, reject) => {
    // The detached worker must outlive the HTTP process it is about to replace.
    const child = spawnWorker(__filename, ["--restart-worker", String(backendPid), String(port), projectRoot], {
      cwd: projectRoot, detached: true, windowsHide: true, execArgv: [],
      stdio: ["ignore", "ignore", "ignore", "ipc"],
      env: { ...process.env, CODEX_BIN: codexExe }
    });
    // Readiness means preflight passed, not that the replacement server has started.
    const timer = setTimeout(() => fail(new Error("Restart worker did not become ready")), 5000);
    const clean = () => {
      clearTimeout(timer);
      child.off("error", fail);
      child.off("exit", exited);
      child.off("message", ready);
    };
    // Failed preparation affects only the worker; the serving backend remains alive.
    const fail = error => { clean(); child.kill(); reject(error); };
    const exited = () => fail(new Error("Restart worker exited before readiness"));
    const ready = message => {
      if (message?.type !== "ready") return;
      clean();
      // No live IPC or stdio handles may keep either process tied to the other.
      if (child.connected) child.disconnect();
      child.unref();
      resolve();
    };
    child.once("error", fail);
    child.once("exit", exited);
    child.on("message", ready);
  });
}

async function waitForProcessExit(pid, { timeoutMs = 30000, intervalMs = 200 } = {}) {
  const deadline = Date.now() + timeoutMs;
  // Never kill by an arbitrary PID: the HTTP server owns its own shutdown.
  while (Date.now() < deadline) {
    try { process.kill(pid, 0); }
    catch (error) {
      if (error.code === "ESRCH") return;
      throw error;
    }
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
  throw new Error("Previous backend did not exit before the restart deadline");
}

async function runRestartWorker({
  projectRoot, port, backendPid, ready = async () => {}, waitForExit = waitForProcessExit,
  start = execFileAsync
}) {
  const entry = path.join(projectRoot, "start-backend.ps1");
  // These arguments originate in the server, but validate again across the process boundary.
  if (!Number.isInteger(backendPid) || backendPid <= 0 ||
      !Number.isInteger(port) || port < 1 || port > 65535 || !fs.existsSync(entry)) {
    throw new Error("Invalid backend restart parameters");
  }
  // Validate paths before acknowledging: failed preparation must leave the old server alive.
  if (!process.env.CODEX_BIN || !fs.existsSync(process.env.CODEX_BIN)) {
    throw new Error("Codex executable is unavailable for restart");
  }
  // Parent shutdown is authorized only after this acknowledgment.
  await ready();
  await waitForExit(backendPid);
  // Reuse the existing portable launcher and its PID, readiness and logging checks.
  const result = await start("powershell.exe", [
    "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File", entry, "-Port", String(port)
  ], { cwd: projectRoot, windowsHide: true, timeout: 120000, maxBuffer: 1024 * 1024 });
  return result;
}

function createBackendControlHandler({
  projectRoot, port, codexExe, shutdown, enabled = () => true, ready = () => true,
  backendPid = process.pid, platform = process.platform, launchRestart = startRestartWorker
}) {
  const instanceId = randomUUID();
  // Serialize lifecycle actions across tabs and LAN devices, not merely one button.
  let pendingAction = null;
  function send(response, status, data, headers = {}) {
    response.writeHead(status, {
      "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers
    });
    response.end(JSON.stringify(data));
  }
  return async function handleBackendControl(request, response, pathname) {
    if (!pathname.startsWith(CONTROL_ROOT)) return false;
    if (!enabled()) { send(response, 404, { error: "BACKEND_CONTROLS_DISABLED" }); return true; }
    const action = pathname.slice(CONTROL_ROOT.length);
    // The random instance ID lets a client distinguish old and replacement listeners.
    if (action === "status") {
      if (request.method !== "GET") {
        send(response, 405, { error: "METHOD_NOT_ALLOWED" }, { allow: "GET" });
      } else {
        send(response, 200, { instanceId, pendingAction, ready: ready(), supported: platform === "win32" });
      }
      return true;
    }
    if (!["restart", "stop"].includes(action)) { send(response, 404, { error: "NOT_FOUND" }); return true; }
    if (request.method !== "POST") {
      send(response, 405, { error: "METHOD_NOT_ALLOWED" }, { allow: "POST" }); return true;
    }
    // LAN authentication runs first. A non-simple header also protects exempt localhost
    // from cross-origin HTML forms and no-cors requests that could stop the service.
    if (request.headers["x-codex-backend-control"] !== "1" ||
        (request.headers["content-type"] || "").split(";")[0].trim() !== "application/json") {
      send(response, 403, { error: "INVALID_CONTROL_REQUEST" }); return true;
    }
    if (platform !== "win32") { send(response, 501, { error: "WINDOWS_REQUIRED" }); return true; }
    if (pendingAction) { send(response, 409, { error: "BACKEND_CONTROL_PENDING" }); return true; }
    request.resume();
    pendingAction = action;
    try {
      if (action === "restart") await launchRestart({ projectRoot, port, codexExe, backendPid });
      // Send acknowledgment before shutdown so the browser can display progress.
      // The action stays scheduled even if the client disconnects after submission.
      response.once("finish", () => shutdown(action));
      if (response.destroyed) shutdown(action);
      else send(response, 202, { action, instanceId });
    } catch (error) {
      pendingAction = null;
      console.error("Backend control failed:", error.message);
      if (!response.destroyed) send(response, 500, { error: "BACKEND_CONTROL_FAILED" });
    }
    return true;
  };
}

if (require.main === module) {
  const [mode, pid, port, projectRoot] = process.argv.slice(2);
  // This entry is internal IPC only; browsers cannot supply executable paths or commands.
  const ready = () => new Promise((resolve, reject) => {
    if (!process.send) { reject(new Error("Restart worker requires IPC")); return; }
    process.send({ type: "ready" }, error => error ? reject(error) : resolve());
  });
  // Worker output is kept in a project-local log because no browser survives a failed start.
  if (mode !== "--restart-worker") process.exitCode = 1;
  else runRestartWorker({ projectRoot, backendPid: Number(pid), port: Number(port), ready })
    .then(result => {
      fs.mkdirSync(path.join(projectRoot, "logs"), { recursive: true });
      fs.appendFileSync(path.join(projectRoot, "logs", "backend-control.log"),
        `${new Date().toISOString()} Restart completed\n${result.stdout || ""}\n${result.stderr || ""}\n`);
    }).catch(error => {
      process.exitCode = 1;
      fs.mkdirSync(path.join(projectRoot, "logs"), { recursive: true });
      fs.appendFileSync(path.join(projectRoot, "logs", "backend-control.log"),
        `${new Date().toISOString()} Restart failed: ${error.message}\n`);
    });
}

module.exports = { createBackendControlHandler, startRestartWorker, runRestartWorker, waitForProcessExit };
