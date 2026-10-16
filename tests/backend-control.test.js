const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const http = require("node:http");
const { EventEmitter } = require("node:events");
const { spawn } = require("node:child_process");
const {
  createBackendControlHandler, startRestartWorker, runRestartWorker, waitForProcessExit
} = require("../src/backend-control");
const { createControlClient } = require("../extensions/plugins/backend-controls/runtime");

async function fixture(t, options = {}) {
  const launches = [];
  const shutdowns = [];
  // Tests own a tiny HTTP server, never the real CLI or production backend.
  const handler = createBackendControlHandler({
    projectRoot: path.resolve(__dirname, ".."), port: 4387, codexExe: process.execPath,
    platform: "win32", launchRestart: async value => launches.push(value),
    shutdown: action => shutdowns.push(action), ...options
  });
  const server = http.createServer(async (request, response) => {
    if (!await handler(request, response, new URL(request.url, "http://test").pathname)) {
      response.writeHead(404);
      response.end();
    }
  });
  // Ephemeral loopback ports isolate tests from the user's configured backend port.
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}/__bridge/backend/`;
  return {
    launches, shutdowns,
    request: (action, options) => fetch(base + action, options),
    post: action => fetch(base + action, {
      method: "POST", headers: {
        "content-type": "application/json", "x-codex-backend-control": "1"
      }, body: "{}"
    })
  };
}

test("backend controls report a stable instance and accept only fixed guarded POST actions", async t => {
  // Read-only probes must not change the instance or initiate a lifecycle operation.
  const app = await fixture(t);
  const first = await (await app.request("status")).json();
  const second = await (await app.request("status")).json();
  assert.equal(first.instanceId, second.instanceId);
  assert.equal(first.ready, true);
  // Navigations, forms and arbitrary command names must have no process effects.
  assert.equal((await app.request("restart")).status, 405);
  assert.equal((await app.request("stop", { method: "POST" })).status, 403);
  assert.equal((await app.post("execute")).status, 404);
  assert.deepEqual(app.launches, []);
  assert.deepEqual(app.shutdowns, []);
});

test("restart acknowledges before shutdown and duplicate actions cannot launch another worker", async t => {
  // The isolated callback records shutdown rather than terminating the test runner.
  const app = await fixture(t);
  const response = await app.post("restart");
  assert.equal(response.status, 202);
  const result = await response.json();
  assert.equal(result.action, "restart");
  assert.equal(app.launches.length, 1);
  assert.deepEqual(app.shutdowns, ["restart"]);
  // Serialization must reject both a duplicate restart and a competing stop.
  assert.equal((await app.post("restart")).status, 409);
  assert.equal((await app.post("stop")).status, 409);
  assert.equal(app.launches.length, 1);
  assert.equal((await (await app.request("status")).json()).pendingAction, "restart");
});

test("stop uses server-owned shutdown without invoking the restart launcher", async t => {
  // Stop is intentionally not implemented by starting another maintenance process.
  const app = await fixture(t);
  const response = await app.post("stop");
  assert.equal(response.status, 202);
  await response.json();
  assert.deepEqual(app.launches, []);
  assert.deepEqual(app.shutdowns, ["stop"]);
});

test("disabled or unsupported controls cannot stop a backend", async t => {
  // The plugin switch applies to backend routes as well as visible frontend controls.
  const disabled = await fixture(t, { enabled: () => false });
  assert.equal((await disabled.post("stop")).status, 404);
  // The existing startup script is Windows-specific; do not claim cross-platform support.
  const unsupported = await fixture(t, { platform: "linux" });
  assert.equal((await unsupported.post("restart")).status, 501);
  assert.deepEqual(disabled.shutdowns, []);
  assert.deepEqual(unsupported.shutdowns, []);
});

test("restart preparation failure leaves the server alive and permits a later retry", async t => {
  let fail = true;
  const app = await fixture(t, {
    launchRestart: async () => { if (fail) throw new Error("test worker failed"); }
  });
  // An accepted shutdown must not precede a ready restart worker.
  assert.equal((await app.post("restart")).status, 500);
  assert.deepEqual(app.shutdowns, []);
  assert.equal((await (await app.request("status")).json()).pendingAction, null);
  // Failure must release the global lifecycle lock rather than poisoning future attempts.
  fail = false;
  assert.equal((await app.post("restart")).status, 202);
  assert.deepEqual(app.shutdowns, ["restart"]);
});

test("restart worker launch uses detached hidden IPC and preserves the resolved CLI", async () => {
  // Paths with spaces must remain separate arguments, not shell-built commands.
  let invocation;
  const child = new EventEmitter();
  child.connected = true;
  child.disconnect = () => { child.connected = false; };
  child.unref = () => { child.unreferenced = true; };
  child.kill = () => {};
  await startRestartWorker({
    projectRoot: "C:\\project with spaces", port: 4398, backendPid: 123, codexExe: process.execPath,
    spawnWorker(file, args, options) {
      invocation = { file, args, options };
      // Simulate only the worker handshake; no Windows processes are launched.
      queueMicrotask(() => child.emit("message", { type: "ready" }));
      return child;
    }
  });
  assert.deepEqual(invocation.args, ["--restart-worker", "123", "4398", "C:\\project with spaces"]);
  // Both detachment and closed IPC are necessary for surviving parent termination.
  assert.equal(invocation.options.detached, true);
  assert.equal(invocation.options.windowsHide, true);
  assert.equal(invocation.options.env.CODEX_BIN, process.execPath);
  assert.equal(child.connected, false);
  assert.equal(child.unreferenced, true);
});

test("early worker exit rejects preparation instead of reporting a successful restart", async () => {
  // A spawn event alone is insufficient: the worker must explicitly acknowledge readiness.
  const child = new EventEmitter();
  child.kill = () => {};
  await assert.rejects(startRestartWorker({
    projectRoot: "C:\\test", port: 4387, backendPid: 123, codexExe: process.execPath,
    spawnWorker() {
      queueMicrotask(() => child.emit("exit", 1));
      return child;
    }
  }), /before readiness/);
});

test("worker waits for the old process then reuses the portable startup script", async () => {
  // Dependency injection verifies ordering without executing a production launcher.
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "codex-restart-worker-"));
  const previous = process.env.CODEX_BIN;
  const calls = [];
  try {
    // Only a test-owned placeholder launcher is created; executing it is mocked.
    fs.writeFileSync(path.join(directory, "start-backend.ps1"), "# test fixture\n");
    process.env.CODEX_BIN = process.execPath;
    await runRestartWorker({
      projectRoot: directory, port: 4398, backendPid: 123,
      ready: async () => calls.push("ready"),
      waitForExit: async pid => calls.push(["wait", pid]),
      start: async (program, args, options) => {
        calls.push(["start", program, args, options]);
        return { stdout: "", stderr: "" };
      }
    });
    // Listening on the same port is safe only after the prior process has exited.
    assert.equal(calls[0], "ready");
    assert.deepEqual(calls[1], ["wait", 123]);
    assert.equal(calls[2][1], "powershell.exe");
    assert.deepEqual(calls[2][2].slice(-4),
      ["-File", path.join(directory, "start-backend.ps1"), "-Port", "4398"]);
    assert.equal(calls[2][3].cwd, directory);
    assert.equal(calls[2][3].windowsHide, true);
    // Bad preflight parameters must never acknowledge readiness or run startup.
    await assert.rejects(runRestartWorker({
      projectRoot: directory, port: 0, backendPid: 123,
      ready: async () => { throw new Error("must not be called"); }
    }), /Invalid backend restart parameters/);
  } finally {
    if (previous === undefined) delete process.env.CODEX_BIN;
    else process.env.CODEX_BIN = previous;
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("waiting for a live process times out without terminating it", async () => {
  // Probe this test process only; no process termination is performed.
  await assert.rejects(waitForProcessExit(process.pid, { timeoutMs: 5, intervalMs: 2 }), /deadline/);
});

test("browser controls preserve mount and CSRF metadata without sending shell commands", async () => {
  // The frontend supplies intent only; process and project paths belong to the server.
  const calls = [];
  const client = createControlClient({
    __codexBrowserBasePath: "/codex/", __codexBrowserCsrfToken: "test-csrf",
    fetch: async (url, options) => {
      calls.push({ url, options });
      return { status: 202, json: async () => ({ action: "restart", instanceId: "old" }) };
    }
  });
  const result = await client.submit("restart");
  assert.equal(result.instanceId, "old");
  assert.equal(calls[0].url, "/codex/__bridge/backend/restart");
  assert.equal(calls[0].options.headers["x-codex-csrf"], "test-csrf");
  assert.equal(calls[0].options.headers["x-codex-backend-control"], "1");
  assert.equal(calls[0].options.body, "{}");
  // The endpoint chooses behavior; user-controlled commands never enter the payload.
  await assert.rejects(client.submit("execute"), /无效/);
  assert.equal(calls.length, 1);
});

test("browser waits for a new ready instance and tolerates restart connection failures", async () => {
  // A live but initializing replacement must not trigger a premature page reload.
  const results = [
    new Error("disconnected"),
    { instanceId: "old", ready: true },
    { instanceId: "new", ready: false },
    { instanceId: "new", ready: true }
  ];
  const client = createControlClient({
    fetch: async () => {
      const value = results.shift();
      if (value instanceof Error) throw value;
      return { status: 200, ok: true, json: async () => value };
    }
  }, { pause: async () => {} });
  assert.equal(await client.waitForRestart("old"), true);
  assert.equal(results.length, 0);
});

test("browser handles renewed LAN login and does not mistake the old instance for a restart", async () => {
  const login = createControlClient({
    fetch: async () => ({ status: 401 })
  }, { pause: async () => {} });
  // Authentication sessions are process-local and intentionally expire on restart.
  assert.equal(await login.waitForRestart("old"), true);
  // Continually successful responses from the old server still count as restart failure.
  const old = createControlClient({
    fetch: async () => ({ status: 200, ok: true, json: async () => ({ instanceId: "old", ready: true }) })
  }, { pause: async () => {} });
  await assert.rejects(old.waitForRestart("old"), /未在预期时间/);
  // Disposing a plugin must suppress its eventual asynchronous page reload.
  assert.equal(await old.waitForRestart("old", () => false), false);
});

test("production controls run after authentication and stay independently switchable", () => {
  const source = fs.readFileSync(path.join(__dirname, "..", "src", "server.js"), "utf8");
  // Source order protects the actual routes, not only the isolated handler fixture.
  assert.ok(source.indexOf("if (!await allowRequest") < source.indexOf("if (await handleBackendControl"));
  assert.match(source, /enabled: \(\) => extensionLoader\.isEnabled\("plugins", "backend-controls"\)/);
  const runtime = fs.readFileSync(path.join(__dirname, "..", "extensions", "plugins",
    "backend-controls", "runtime.js"), "utf8");
  assert.match(runtime, /data-settings-panel-slug="data-controls"/);
  // DOM presentation is reused instead of adding a permanent official bundle patch.
  assert.match(runtime, /cloneNode\(true\)/);
});

test("real detached worker restarts and stops isolated HTTP processes through the startup script",
  { skip: process.platform !== "win32", timeout: 30000 }, async t => {
    // This test exercises actual Windows fork, IPC, process exit and PowerShell launch.
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "codex-control-process-"));
    const entry = path.join(__dirname, "fixtures", "backend-control-server.cjs");
    // The temporary launcher starts only the disposable fixture, never src/server.js.
    fs.writeFileSync(path.join(directory, "start-backend.ps1"), [
      "param([int]$Port)",
      "$ErrorActionPreference = 'Stop'",
      "$arguments = '\"' + $env:CONTROL_TEST_SERVER + '\" \"' + $PSScriptRoot + '\" ' + $Port",
      "$child = Start-Process -FilePath $env:CODEX_BIN -ArgumentList $arguments -WindowStyle Hidden -PassThru",
      "Write-Output ('Fixture started ' + $child.Id)"
    ].join("\r\n"));
    const child = spawn(process.execPath, [entry, directory, "0"], {
      windowsHide: true, stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, CODEX_BIN: process.execPath, CONTROL_TEST_SERVER: entry }
    });
    let base;
    // Cleanup is restricted to the PID file in this test-owned temporary directory.
    t.after(async () => {
      child.kill();
      for (const name of ["worker.pid", "fixture.pid"]) {
        const pidFile = path.join(directory, name);
        if (fs.existsSync(pidFile)) {
          const pid = Number(fs.readFileSync(pidFile, "utf8"));
          if (pid !== process.pid && Number.isInteger(pid) && pid > 0) {
            try { process.kill(pid); } catch {}
          }
        }
      }
      fs.rmSync(directory, { recursive: true, force: true });
    });
    const started = await new Promise((resolve, reject) => {
      let output = "";
      let errors = "";
      const timer = setTimeout(() => reject(new Error("Fixture startup timed out: " + errors)), 5000);
      child.once("error", error => { clearTimeout(timer); reject(error); });
      child.once("exit", code => { clearTimeout(timer); reject(new Error("Fixture exited: " + code + errors)); });
      child.stderr.on("data", chunk => { errors += chunk; });
      child.stdout.on("data", chunk => {
        output += chunk;
        if (!output.includes("\n")) return;
        clearTimeout(timer);
        resolve(JSON.parse(output.split("\n")[0]));
      });
    });
    base = `http://127.0.0.1:${started.port}/__bridge/backend/`;
    const client = createControlClient({
      __codexBrowserBasePath: base.replace("__bridge/backend/", ""), fetch, setTimeout, AbortSignal
    });
    // No account or CLI session is needed to verify service replacement semantics.
    const original = await (await fetch(base + "status")).json();
    const accepted = await client.submit("restart");
    assert.equal(accepted.instanceId, original.instanceId);
    // The real worker must survive parent exit and start a different listening instance.
    assert.equal(await client.waitForRestart(original.instanceId), true);
    const replacement = await (await fetch(base + "status")).json();
    assert.notEqual(replacement.instanceId, original.instanceId);
    const replacementPid = Number(fs.readFileSync(path.join(directory, "fixture.pid"), "utf8"));
    assert.notEqual(replacementPid, started.pid);
    // Follow restart with a real stop to verify both buttons' lifecycle contracts.
    assert.equal((await client.submit("stop")).action, "stop");
    await waitForProcessExit(replacementPid, { timeoutMs: 5000, intervalMs: 50 });
    // Wait for worker logging to finish before removing its temporary workspace.
    const log = path.join(directory, "logs", "backend-control.log");
    const deadline = Date.now() + 3000;
    while (!fs.existsSync(log) && Date.now() < deadline) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    assert.match(fs.readFileSync(log, "utf8"), /Restart completed/);
  });
