const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { spawnSync } = require("node:child_process");
const {
  AUTOMATION_CAPABILITIES,
  adaptAutomationRenderer
} = require("../src/renderer-automation-adapter");

const project = path.resolve(__dirname, "..");
const rendererPath = path.join(
  project,
  "runtime/codex-frontend-26.917.9434/webview/assets/app-initial-fc9a33fdda88.js"
);
const pluginSource = fs.readFileSync(
  path.join(project, "extensions/plugins/disable-automations/runtime.js"), "utf8"
);
const originalRenderer = fs.readFileSync(rendererPath, "utf8");
const adaptedRenderer = adaptAutomationRenderer(originalRenderer);

function runtimeFixture() {
  const location = { href: "http://localhost/codex/" };
  const context = vm.createContext({ window: {}, location, URL });
  // Evaluate the real extension without a DOM, model, or network dependency.
  vm.runInContext(pluginSource, context);
  return context;
}

function section(source, start, end) {
  const first = source.indexOf(start);
  const last = source.indexOf(end, first);
  assert.ok(first >= 0 && last > first, `Missing production boundary: ${start}`);
  return source.slice(first, last);
}

test("automation adapter matches the pinned renderer and disables its UI sources", () => {
  const source = originalRenderer;
  const adapted = adaptedRenderer;

  assert.notEqual(adapted, source);
  assert.match(adapted, /__codexBrowserDisableAutomations===!0/);
  assert.match(adapted, /dF=a_\(X,`list-automations`,\{enabled:!1/);
  assert.match(adapted, /qJr=a_\(X,`inbox-items`,\{enabled:!1/);
  assert.match(adapted, /xWr=a_\(X,`inbox-items`,\{enabled:!1/);
  assert.doesNotMatch(adapted, /\[`manageTasks`,oBr\],/);
  assert.match(adapted, /path:`\/inbox`,element:\(0,T5\.jsx\)\(_d,\{to:`\/`,replace:!0\}\)/);
  assert.match(adapted, /isAvailable:\(\)=>window\.__codexBrowserDisableAutomations!==!0,kind:kPs/);
  assert.match(adapted, /I=window\.__codexBrowserDisableAutomations===!0\?null:/);
});

test("automation capability names remain explicit and separate from CLI tools", () => {
  assert.deepEqual(AUTOMATION_CAPABILITIES, [
    "automations.local",
    "automations.cloud",
    "automations.cloud.scheduled-tasks",
    "scheduled-tasks",
    "local-automations",
    "cloud-automations"
  ]);
  const plugin = pluginSource;
  assert.match(plugin, /beforeBridgeMessage/);
  assert.match(plugin, /FRONTEND_EXTENSION_DISABLED|automations-disabled/);
  assert.doesNotMatch(plugin, /dynamicTools|automation_update/);
  // Tool declarations and transcript conversion are not part of this adapter.
  for (const boundary of [
    ["N0t=`automation_update`", "function"],
    ["if(n.tool===`automation_update`", "case`collabAgentToolCall`"]
  ]) {
    assert.equal(section(adaptedRenderer, ...boundary),
      section(originalRenderer, ...boundary));
  }
});

test("extension switch is enabled while the Nahida theme remains independent", () => {
  const config = JSON.parse(
    fs.readFileSync(path.join(project, "extensions/config.json"), "utf8")
  );
  assert.equal(config.plugins["disable-automations"], true);
  assert.equal(config.themes.nahida, false);
});

test("queries and capability selectors stop work before host requests exist", () => {
  const context = runtimeFixture();
  const queries = [];
  Object.assign(context, {
    X: {},
    _: { ONE_MINUTE: 60000, FIVE_SECONDS: 5000 },
    a_: (_scope, name, options) => { queries.push({ name, ...options }); return {}; },
    ls: (_scope, reader) => reader,
    ns: (_scope, reader) => reader,
    rJi: () => true,
    iJi: () => true,
    aJi: { chatgpt: { accessPolicies: [], statsig: [], settings: [], configFeatures: [] } },
    get: () => { throw new Error("Disabled capability read a downstream dependency"); }
  });
  // These are the production declarations, not independent mock query logic.
  for (const name of ["dF", "qJr", "xWr"]) {
    const declaration = adaptedRenderer.match(
      new RegExp(`${name}=a_\\(X,\`(?:list-automations|inbox-items)\`,\\{[^)]*\\}\\)`)
    );
    assert.ok(declaration, name);
    vm.runInContext(`var ${declaration[0]};`, context);
  }
  assert.equal(queries.length, 3);
  assert.ok(queries.every(query => query.enabled === false && query.refetchInterval === false));

  const selector = section(adaptedRenderer, "bU=ns(X,(e,{get:t})=>{", "})))()}function SU");
  vm.runInContext(`var ${selector};`, context);
  for (const name of AUTOMATION_CAPABILITIES) {
    assert.deepEqual(JSON.parse(JSON.stringify(context.bU({ name }, { get: context.get }))),
      { isLoading: false, isError: false, isCapable: false });
  }
  assert.equal(context.bU({ name: "chatgpt" }, { get: context.get }).isCapable, true);

  const cloudGate = section(adaptedRenderer, "yU=ls(X,({get:e})=>{", ",aqi=");
  vm.runInContext(`var ${cloudGate};`, context);
  assert.equal(context.yU({ get: context.get }), null);
});

test("guard matches API paths and messages, not file references or CLI tools", () => {
  const { window } = runtimeFixture();
  const policy = window.__codexBrowserExtensionPolicy;
  for (const url of [
    "vscode://codex/list-automations", "vscode://codex/inbox-items?limit=200",
    "/automation-create", "/automation-run-archive", "/create-automation",
    "https://chatgpt.com/backend-api/automations/save",
    "https://chatgpt.com/backend-api/automation/task-id/run"
  ]) {
    assert.equal(policy.beforeBridgeMessage({ type: "fetch", url }).blocked, true, url);
    assert.equal(policy.beforeFetchRequest(new URL(url, "http://localhost/")).blocked, true);
  }
  for (const type of [
    "inbox-items-create", "inbox-item-set-read-state",
    "inbox-automation-runs-mark-all-read", "heartbeat-automation-thread-state-changed"
  ]) {
    assert.equal(policy.beforeBridgeMessage({ type }).blocked, true);
  }
  // Query values and model RPC parameters are deliberately outside the policy.
  for (const message of [
    { type: "fetch", url: "/__bridge/local-file?path=automation-create.js" },
    { type: "fetch", url: "/assets/automation-side-panel-tab.js" },
    { type: "fetch", url: "/get-settings?name=automations" },
    { type: "mcp-request", request: { method: "mcpServer/tool/call",
      params: { toolName: "automation_update" } } },
    { type: "mcp-request", request: { method: "thread/resume", params: { dynamicTools: [] } } }
  ]) {
    assert.equal(policy.beforeBridgeMessage(message), null);
  }
  const before = window.__codexBrowserDisableAutomationsRuntime.snapshot().blockedCount;
  vm.runInNewContext(pluginSource, { window, location: { href: "http://localhost/" }, URL });
  assert.equal(window.__codexBrowserDisableAutomationsRuntime.snapshot().blockedCount, 0);
  assert.ok(before > 0);
  window.__codexBrowserDisableAutomationsRuntime.dispose();
  assert.equal(window.__codexBrowserExtensionPolicy, undefined);
});

test("bridge rejects disabled requests locally and settles the official fetch envelope", () => {
  const context = runtimeFixture();
  const calls = [];
  const replies = [];
  const telemetry = [];
  const bridge = fs.readFileSync(path.join(project, "src/bridge.js"), "utf8");
  Object.assign(context, {
    queueBridgeTelemetry: entry => telemetry.push(entry),
    reply: message => replies.push(message),
    fetch: (...args) => calls.push(args),
    workerListeners: new Map()
  });
  // Isolate the guard at the dispatcher's actual first boundary, before I/O.
  const guard = section(bridge, "  const record = (message) => {",
    '    if (message?.type === "electron-window-focus-request")');
  vm.runInContext(`${guard} return true; }; globalThis.dispatch = record;`, context);
  assert.equal(context.dispatch({
    type: "fetch", requestId: 0, url: "vscode://codex/list-automations"
  }), false);
  assert.equal(replies[0].requestId, 0);
  assert.equal(replies[0].status, 410);
  assert.equal(JSON.parse(replies[0].bodyJsonString).code, "FRONTEND_EXTENSION_DISABLED");
  assert.equal(calls.length, 0);
  assert.equal(telemetry[0].category, "extension-policy");
  assert.equal(context.dispatch({ type: "mcp-request",
    request: { id: 0, method: "model/list" } }), true);
});

test("direct-fetch guard does not create a backend or external request", async () => {
  const context = runtimeFixture();
  const calls = [];
  Object.assign(context, { Response, Request, Headers });
  context.window.fetch = async (...args) => { calls.push(args); return new Response("{}"); };
  context.window.__codexBrowserPaths = {
    basePath: "/", publicPath: value => value
  };
  context.location.origin = "http://localhost";
  const bridge = fs.readFileSync(path.join(project, "src/bridge.js"), "utf8");
  const transport = bridge.slice(0, bridge.indexOf("  // LAN HTTP"));
  vm.runInContext(transport + "\n})();", context);
  const rejected = await context.window.fetch("/automations");
  assert.equal(rejected.status, 410);
  assert.equal(calls.length, 0);
  await context.window.fetch("/__bridge/local-file?path=automation-create.js");
  assert.equal(calls.length, 1);
});

test("adapted bundle remains valid JavaScript and unknown builds fail loudly", () => {
  // Parse the full served module, without executing its bootstrap or model calls.
  const parsed = spawnSync(process.execPath, ["--check", "--input-type=module"], {
    input: adaptedRenderer, encoding: "utf8", timeout: 15000
  });
  assert.equal(parsed.status, 0, parsed.stderr);
  assert.throws(() => adaptAutomationRenderer(originalRenderer.replace(
    "dF=a_(X,`list-automations`", "dF=a_(X,`changed-automations`"
  )), /signature mismatch/);
});
