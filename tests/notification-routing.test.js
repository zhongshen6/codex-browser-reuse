const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { EventEmitter } = require("node:events");
const { test } = require("node:test");

const project = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(project, "src", "server.js"), "utf8");
// Exercise the actual request adapter without starting HTTP, CLI, or Windows.
// Keep production startup unchanged rather than adding test-only API routes.
const adapterStart = source.indexOf("const appServerParamKeys =");
const adapterEnd = source.indexOf("async function callAppServer(", adapterStart);
assert.ok(adapterStart >= 0 && adapterEnd > adapterStart, "Request adapter boundary changed");
const adapterContext = vm.createContext({
  workspaceRoot: project,
  // Match the production map: these are browser-owned local project IDs,
  // not identifiers understood by the CLI app-server.
  projectsById: new Map([["local-project", { id: "local-project" }]])
});
vm.runInContext(source.slice(adapterStart, adapterEnd), adapterContext);
const adapt = request => JSON.parse(JSON.stringify(
  adapterContext.adaptAppServerRequest(request)
));

test("named profiles reach CLI without an inferred sandbox policy", () => {
  for (const method of ["thread/start", "thread/resume", "turn/start"]) {
    const request = {
      id: "profile-test", method,
      params: {
        threadId: "test-thread",
        cwd: project,
        permissions: ":workspace",
        runtimeWorkspaceRoots: [project],
        sandboxPolicy: null,
        input: []
      }
    };
    const result = adapt(request);
    assert.equal(result.params.permissions, ":workspace");
    assert.deepEqual(result.params.runtimeWorkspaceRoots, [project]);
    assert.equal(result.params.sandbox, undefined);
    assert.ok(result.params.sandboxPolicy == null);
    // Adaptation must not mutate the renderer's original request object.
    assert.equal(request.params.sandboxPolicy, null);
  }
});

test("desktop provider cleanup preserves the permission-tool feature", () => {
  const result = adapt({
    id: "feature-test", method: "thread/start",
    params: {
      permissions: ":workspace",
      modelProvider: "codex_vscode_copilot",
      approvalPolicy: { granular: { request_permissions: true, sandbox_approval: false } },
      config: {
        model_provider: "codex_vscode_copilot",
        "model_providers.codex_vscode_copilot": { wire_api: "responses" },
        "plugins.codex-app-tools@openai-bundled.mcp_servers.codex_app.enabled_tools": [],
        "features.request_permissions_tool": true
      }
    }
  });
  assert.equal(result.params.modelProvider, undefined);
  assert.deepEqual(result.params.config, { "features.request_permissions_tool": true });
  assert.equal(result.params.approvalPolicy.granular.request_permissions, true);
});

test("local project IDs stay in browser state and are not sent to the CLI", () => {
  const result = adapt({
    id: "local-project-test",
    method: "thread/start",
    params: {
      projectId: "local-project",
      cwd: "C:\\114514\\program",
      model: "gpt-6-sol",
      permissions: ":workspace"
    }
  });
  assert.equal(result.params.projectId, undefined);
  assert.equal(result.params.cwd, "C:\\114514\\program");
  assert.equal(result.params.model, "gpt-6-sol");
});

test("unknown project IDs remain available for app-server-owned projects", () => {
  const result = adapt({
    id: "remote-project-test",
    method: "thread/start",
    params: {
      projectId: "cloud-project-123",
      cwd: "C:\\114514\\program"
    }
  });
  assert.equal(result.params.projectId, "cloud-project-123");
});

test("explicit sandbox mode and environment parameters retain their semantics", () => {
  const environments = [{ environmentId: "local", cwd: project }];
  const result = adapt({
    id: "sandbox-test", method: "turn/start",
    params: {
      threadId: "test-thread", input: [], sandbox: "read-only", environments,
      collaborationMode: { mode: "default", settings: { model: "gpt-6-sol" } }
    }
  });
  assert.deepEqual(result.params.sandboxPolicy, { type: "readOnly", networkAccess: false });
  assert.deepEqual(result.params.environments, environments);
  assert.equal(result.params.collaborationMode.settings.model, "gpt-6-sol");
});

function notificationFixture() {
  const calls = [];
  const responses = [];
  const pending = new Map();
  let settings = { "notifications-turn-mode": "always", "notifications-sound": "classic" };
  const soundDirectory = path.join(project, "test-resource-path");
  const native = {
    // Mock only the native boundary. All registry, policy, token, and
    // approval-response logic comes from the production notification module.
    spawn() {
      const host = new EventEmitter();
      host.stdout = new EventEmitter();
      host.stderr = new EventEmitter();
      host.kill = () => {};
      queueMicrotask(() => host.stdout.emit("data", "NOTIFICATION_HOST_READY"));
      return host;
    },
    execFile(_program, args, _options, callback) {
      const mode = args[args.indexOf("-Mode") + 1];
      const payload = JSON.parse(Buffer.from(
        args[args.indexOf("-PayloadBase64") + 1], "base64"
      ).toString("utf8"));
      calls.push({ mode, payload });
      queueMicrotask(() => callback(null, JSON.stringify(
        mode === "Hide" ? { hidden: true } : { shown: true }
      ), ""));
    }
  };
  const context = vm.createContext({
    module: { exports: {} }, __dirname: path.join(project, "src"), process, console, Buffer,
    setTimeout, clearTimeout,
    require(name) {
      if (name === "node:child_process") return native;
      if (name === "node:fs") return {
        existsSync: file => file === path.join(soundDirectory, "codex-classic.wav"),
        readdirSync: () => { throw new Error("WindowsApps root enumeration denied"); }
      };
      return require(name);
    }
  });
  vm.runInContext(fs.readFileSync(path.join(project, "src", "desktop-notifications.js"), "utf8"), context);
  const notifier = context.module.exports.createDesktopNotifications({
    port: 4387, soundDirectory,
    readSettings: () => settings,
    getPending: id => pending.get(String(id)),
    respond(id, result) {
      responses.push({ id, result: JSON.parse(JSON.stringify(result)) });
      pending.delete(String(id));
    },
    log() {}
  });
  return { notifier, pending, calls, responses, soundDirectory,
    settings: value => { settings = { ...settings, ...value }; } };
}

test("permissions approval forwards profile, request id zero, and scope", async () => {
  const fixture = notificationFixture();
  const request = { id: 0, method: "item/permissions/requestApproval",
    params: { threadId: "test-thread", permissions: { network: { enabled: true } } } };
  fixture.pending.set("0", request);
  await fixture.notifier.publish({
    id: "approval-local-0", kind: "permission", conversationId: "test-thread", requestId: 0
  });
  const record = fixture.notifier.status().notifications[0];
  assert.equal(fixture.calls[0].payload.soundPath,
    path.join(fixture.soundDirectory, "codex-classic.wav"));
  await fixture.notifier.action({ id: record.id, token: record.token, type: "approve" });
  assert.deepEqual(fixture.responses, [{
    id: 0, result: { permissions: request.params.permissions, scope: "turn" }
  }]);
  assert.equal(fixture.calls.at(-1).mode, "Hide");
  // A delayed second click must not approve an unrelated or resolved request.
  await assert.rejects(fixture.notifier.action({
    id: record.id, token: record.token, type: "approve"
  }), /already been resolved/);
});

test("declining a profile grants nothing and command declines use offered decisions", async () => {
  const fixture = notificationFixture();
  // Both approval protocols are live: permissions return a profile, while
  // command approvals return an offered decision. Never interchange them.
  for (const [id, method, params, expected] of [
    [1, "item/permissions/requestApproval", { permissions: { network: { enabled: true } } },
      { permissions: {}, scope: "turn" }],
    [2, "item/commandExecution/requestApproval", { availableDecisions: ["accept", "cancel"] },
      { decision: "cancel" }]
  ]) {
    fixture.pending.set(String(id), { id, method, params: { threadId: "test-thread", ...params } });
    await fixture.notifier.publish({
      id: `approval-local-${id}`, kind: "permission", conversationId: "test-thread", requestId: id
    });
    const record = fixture.notifier.status().notifications.at(-1);
    await fixture.notifier.action({ id: record.id, token: record.token, type: "decline" });
    assert.deepEqual(fixture.responses.at(-1), { id, result: expected });
  }
});

test("open and reply remain browser actions and require the correct token", async () => {
  const { notifier } = notificationFixture();
  // Native activation must resolve to this web backend, never codex://.
  await notifier.publish({ id: "completed-test", kind: "turn-complete", conversationId: "test-thread" });
  const record = notifier.status().notifications[0];
  const action = type => notifier.action({ id: record.id, token: record.token, type, reply: "hello" });
  assert.equal((await action("open")).openUrl, "http://127.0.0.1:4387/local/test-thread");
  assert.equal((await action("reply")).reply, "hello");
  await assert.rejects(notifier.action({
    id: record.id, token: "wrong", type: "open"
  }), /stale or invalid/);
});

test("notification switches are live and a closed renderer needs no heartbeat", async () => {
  const fixture = notificationFixture();
  fixture.settings({ "notifications-permissions-enabled": false, "notifications-turn-mode": "off" });
  assert.equal((await fixture.notifier.publish({
    id: "off-permission", kind: "permission"
  })).suppressed, true);
  assert.equal((await fixture.notifier.publish({
    id: "off-turn", kind: "turn-complete"
  })).suppressed, true);
  fixture.settings({ "notifications-turn-mode": "unfocused", "notifications-sound": "none" });
  // There are no clients at all, as when every frontend tab is closed.
  assert.equal((await fixture.notifier.publish({
    id: "closed-browser", kind: "turn-complete"
  })).shown, true);
  assert.equal(fixture.calls.at(-1).payload.soundPath, null);
  fixture.notifier.presence({ clientId: "live", focused: true, visible: true });
  assert.equal((await fixture.notifier.publish({
    id: "focused", kind: "turn-complete"
  })).suppressed, true);
});

function mcpApprovalRequest(id, overrides = {}) {
  return { id, method: "mcpServer/elicitation/request", params: {
    threadId: "test-thread", turnId: `turn-${id}`, serverName: "execution",
    mode: "form", message: 'Allow the execution MCP server to run tool "program_exec"?',
    requestedSchema: { type: "object", properties: {} },
    _meta: { codex_approval_kind: "mcp_tool_call", persist: ["session", "always"],
      tool_params: { program: "ping.exe", args: ["-n", "4", "baidu.com"], target: "local" } },
    ...overrides
  } };
}

test("MCP requests notify without a renderer and reply using the elicitation protocol", async () => {
  // Exercise onRequest itself: earlier tests manually published approvals and
  // could not detect a missing CLI method in the notification entry point.
  for (const [id, action, expected] of [
    [0, "approve", { action: "accept", content: {}, _meta: null }],
    [1, "decline", { action: "decline", content: null, _meta: null }],
    [2, "approve-for-session", { action: "accept", content: {}, _meta: { persist: "session" } }]
  ]) {
    const f = notificationFixture();
    const request = mcpApprovalRequest(id);
    f.pending.set(String(id), request);
    await f.notifier.onRequest(request);
    const record = f.notifier.status().notifications[0];
    assert.equal(record.notification.kind, "permission");
    assert.match(record.notification.body, /ping.exe/);
    assert.match(record.notification.body, /baidu.com/);
    assert.equal(record.notification.actions.length, 3);
    assert.equal(f.calls[0].mode, "Show");
    await f.notifier.action({ id: record.id, token: record.token, type: action });
    assert.deepEqual(f.responses, [{ id, result: expected }]);
    assert.equal(f.calls.at(-1).mode, "Hide");
    // Clicking a resolved native toast cannot execute the MCP call again.
    await assert.rejects(f.notifier.action({
      id: record.id, token: record.token, type: action
    }), /already been resolved/);
  }
});

test("MCP notifications respect permission settings and advertised session grants", async () => {
  const f = notificationFixture();
  const request = mcpApprovalRequest(3, { _meta: { codex_approval_kind: "mcp_tool_call" } });
  f.pending.set("3", request);
  f.settings({ "notifications-permissions-enabled": false });
  await f.notifier.onRequest(request);
  assert.equal(f.calls.length, 0);
  f.settings({ "notifications-permissions-enabled": true });
  await f.notifier.onRequest(request);
  const record = f.notifier.status().notifications[0];
  assert.equal(record.notification.actions.length, 2);
  await assert.rejects(f.notifier.action({
    id: record.id, token: record.token, type: "approve-for-session"
  }), /unavailable/);
  assert.equal(f.responses.length, 0);
});

test("rich MCP elicitations notify but cannot be approved by empty native responses", async () => {
  // The shared MCP method also carries forms, OAuth, and verification requests.
  // A toast must not fabricate their user input or bypass their proof checks.
  for (const overrides of [
    { _meta: {}, requestedSchema: { type: "object", properties: { name: { type: "string" } } } },
    { requestedSchema: { type: "object", properties: { name: { type: "string" } } } },
    { mode: "url", url: "https://example.test/auth" },
    { mode: "openai/userVerification", challenge: "challenge" },
    { _meta: { codex_approval_kind: "mcp_tool_call", connector_id: "connector" } }
  ]) {
    const f = notificationFixture();
    const request = mcpApprovalRequest(4, overrides);
    f.pending.set("4", request);
    await f.notifier.onRequest(request);
    const record = f.notifier.status().notifications[0];
    assert.deepEqual(JSON.parse(JSON.stringify(record.notification.actions)), []);
    assert.equal((await f.notifier.action({
      id: record.id, token: record.token, type: "open"
    })).openUrl, "http://127.0.0.1:4387/local/test-thread");
    await assert.rejects(f.notifier.action({
      id: record.id, token: record.token, type: "approve"
    }), /answered in the browser/);
    assert.equal(f.responses.length, 0);
  }
});

test("generated approvals do not resolve a replacement MCP request", async () => {
  const f = notificationFixture();
  const request = mcpApprovalRequest(5);
  f.pending.set("5", request);
  await f.notifier.onRequest(request);
  const record = f.notifier.status().notifications[0];
  // A reused id in a different turn is not the request the user reviewed.
  f.pending.set("5", mcpApprovalRequest(5, { turnId: "replacement-turn" }));
  await assert.rejects(f.notifier.action({
    id: record.id, token: record.token, type: "approve"
  }), /request has changed/);
  assert.equal(f.responses.length, 0);
});
