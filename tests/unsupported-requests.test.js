const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "../src/bridge.js"), "utf8");
function section(start, end) {
  const first = source.indexOf(start);
  const last = source.indexOf(end, first);
  // Fail loudly if a production boundary changes, rather than test stale fixtures.
  assert.ok(first >= 0 && last > first, `Missing bridge section: ${start}`);
  return source.slice(first, last);
}

function fixture(rpcMessage, hostResponse = { status: 200, body: {} }) {
  const replies = [];
  const calls = [];
  const globalState = new Map();
  const location = { href: "http://localhost/codex/", origin: "http://localhost" };
  const context = vm.createContext({
    URL, location,
    window: { location, postMessage: value => replies.push(JSON.parse(JSON.stringify(value))) },
    performance: { now: () => 0 }, globalState,
    authoritativeGlobalStateKeys: new Set(), browserAppearance: {},
    // These known state keys are handled by the dedicated persistence fixture.
    threadProjectStateKeys: {
      threadAssignments: "thread-project-assignments",
      projectlessThreadIds: "projectless-thread-ids",
      threadWorkspaceRootHints: "thread-workspace-root-hints",
      threadProjectlessOutputDirectories: "thread-projectless-output-directories"
    },
    persistBrowserGlobalState() {}, saveBrowserAppearance() {}, clearThreadUnread() {},
    recordThreadProjects() {}, recordThreadProject() {},
    desktopSettings: { localeOverride: "zh-CN" }, navigator: { language: "en-US" },
    codexHomeRoot: "C:/test/.codex", demoRoot: "C:/test/workspace", projects: [],
    seen: [],
    fetch: async (url, options) => {
      calls.push({ url, options });
      // No real backend or model request: preserve production response envelopes.
      return url === "/__bridge/host-fetch"
        ? { status: hostResponse.status, ok: hostResponse.status < 400,
          json: async () => hostResponse.body }
        : { json: async () => ({ hostId: "test-host", message: rpcMessage }) };
    }
  });
  // Run the actual dispatcher, reply, and telemetry code, not a recreated router.
  vm.runInContext([
    section("  const telemetryQueue =", "  const flushBridgeTelemetry ="),
    section("  const pendingMcpRequests =", "  const notificationClientId ="),
    section("  const realMethods =", "  let notificationCursor ="),
    section("  const record = (message) =>", "  const forwardServerResponse ="),
    "globalThis.fixture = { record, telemetryQueue, realMethods };"
  ].join("\n"), context);
  return {
    calls, globalState, realMethods: context.fixture.realMethods,
    async dispatch(message) {
      const firstReply = replies.length;
      const firstEvent = context.fixture.telemetryQueue.length;
      context.fixture.record(message);
      // Flush asynchronous forwarding callbacks without installing timers or polling.
      await new Promise(resolve => setImmediate(resolve));
      return {
        replies: replies.slice(firstReply),
        events: JSON.parse(JSON.stringify(context.fixture.telemetryQueue.slice(firstEvent)))
      };
    }
  };
}

const hostFetch = (url, params = {}) => ({
  type: "fetch", requestId: "fetch-id", url, body: JSON.stringify(params)
});

test("unknown reads and writes return unsupported instead of reporting success", async () => {
  for (const route of [
    "/unknown-read", "/unimplemented-file-write",
    "/set-pinned-threads-order", "/create-automation", "/external-agent-import-start"
  ]) {
    const f = fixture();
    const { replies, events } = await f.dispatch(hostFetch(route, { value: "private-data" }));
    const response = replies[0];
    assert.equal(replies.length, 1);
    assert.equal(response.requestId, "fetch-id");
    assert.equal(response.responseType, "error");
    assert.equal(response.status, 501);
    assert.equal(response.headers["content-type"], "application/json");
    const body = JSON.parse(response.bodyJsonString);
    assert.equal(body.code, "BRIDGE_UNSUPPORTED_REQUEST");
    assert.equal(body.request, route);
    assert.match(body.error, /不支持/);
    // Passive request diagnostics are allowed; unsupported operations must not execute.
    assert.deepEqual(f.calls.map(call => call.url), ["/__bridge/message"]);
    assert.equal(events.at(-1).outcome, "error");
    assert.equal(events.at(-1).category, "unhandled");
    assert.equal(events.at(-1).empty, false);
  }
});

test("unimplemented lists no longer masquerade as legitimately empty collections", async () => {
  for (const route of [
    "/local-custom-agents", "/inbox-items", "/list-automations"
  ]) {
    const { replies, events } = await fixture().dispatch(hostFetch(route));
    assert.equal(replies[0].status, 501);
    assert.equal(JSON.parse(replies[0].bodyJsonString).code, "BRIDGE_UNSUPPORTED_REQUEST");
    assert.equal(events.at(-1).outcome, "error");
    assert.equal(events.at(-1).empty, false);
  }
});

test("unsupported errors expose only the safe path, never query credentials or body", async () => {
  const { replies, events } = await fixture().dispatch(
    hostFetch("https://user:secret@example.test/unknown?token=private-token", { secret: "private-body" })
  );
  const response = replies[0];
  assert.equal(JSON.parse(response.bodyJsonString).request, "/unknown");
  // Structured telemetry may record field names, but never their values or URL secrets.
  assert.doesNotMatch(JSON.stringify({ response, events }), /private-token|private-body|user:secret/);
});

test("unknown RPC preserves zero id and host and reports JSON-RPC method-not-found", async () => {
  const f = fixture();
  const { replies, events } = await f.dispatch({
    type: "mcp-request", hostId: "remote-host", request: { id: 0, method: "unknown/list" }
  });
  assert.equal(replies.length, 1);
  assert.equal(replies[0].hostId, "remote-host");
  assert.equal(replies[0].message.id, 0);
  assert.equal(replies[0].message.error.code, -32601);
  assert.equal(replies[0].message.error.data.code, "BRIDGE_UNSUPPORTED_REQUEST");
  assert.equal(Object.hasOwn(replies[0].message, "result"), false);
  assert.equal(f.calls.some(call => call.url === "/__bridge/rpc"), false);
  assert.equal(events.at(-1).outcome, "error");
});

test("supported RPC retains real forwarding including valid empty results and CLI errors", async () => {
  for (const message of [
    { id: 0, result: {} },
    { id: 0, result: { data: [], nextCursor: null } },
    { id: 0, error: { code: -32000, message: "upstream failure", data: { source: "cli" } } }
  ]) {
    const f = fixture(message);
    const request = {
      type: "mcp-request", hostId: "test-host",
      request: { id: 0, method: "model/list", params: { limit: 10 } }
    };
    const { replies, events } = await f.dispatch(request);
    // The unsupported fallback must never intercept a method owned by the CLI.
    assert.equal(f.calls.length, 1);
    assert.equal(f.calls[0].url, "/__bridge/rpc");
    assert.deepEqual(JSON.parse(f.calls[0].options.body), request);
    assert.deepEqual(replies[0].message, message);
    assert.equal(events.at(-1).category, "real-forward");
    assert.equal(events.at(-1).outcome, message.error ? "error" : "success");
  }
});

test("legitimate null reads and persisted writes remain successful", async () => {
  const f = fixture();
  const read = await f.dispatch(hostFetch("/get-global-state", { key: "new-setting" }));
  assert.equal(read.replies[0].status, 200);
  assert.deepEqual(JSON.parse(read.replies[0].bodyJsonString), { value: null });
  const write = await f.dispatch(hostFetch("/set-global-state", { key: "new-setting", value: 42 }));
  assert.equal(write.replies[0].responseType, "success");
  assert.equal(f.globalState.get("new-setting"), 42);
  // An unavailable value is not evidence that the API itself is unsupported.
  assert.equal(read.events.at(-1).outcome, "success");
  assert.equal(write.events.at(-1).outcome, "success");
});

test("intentionally disabled capabilities and real locale bootstrap remain intact", async () => {
  const f = fixture();
  const disabled = await f.dispatch(hostFetch("/is-copilot-api-available"));
  assert.equal(disabled.replies[0].status, 200);
  assert.deepEqual(JSON.parse(disabled.replies[0].bodyJsonString), { available: false });
  const locale = await f.dispatch(hostFetch("/locale-info"));
  assert.deepEqual(JSON.parse(locale.replies[0].bodyJsonString),
    { ideLocale: "zh-CN", systemLocale: "en-US" });
});

test("official thread preparation receives null proxy and no desktop MCP overlay", async () => {
  const f = fixture();
  const proxy = await f.dispatch(hostFetch("/get-copilot-api-proxy-info"));
  assert.equal(proxy.replies[0].status, 200);
  assert.equal(JSON.parse(proxy.replies[0].bodyJsonString), null);
  const config = await f.dispatch(hostFetch("/mcp-codex-config", { cwd: "C:/test" }));
  assert.deepEqual(JSON.parse(config.replies[0].bodyJsonString), { config: {} });
  const dictation = await f.dispatch(hostFetch("/global-dictation-hotkey-state"));
  assert.deepEqual(JSON.parse(dictation.replies[0].bodyJsonString), {
    supported: false, configuredHotkey: null, configuredToggleHotkey: null
  });
  // Valid disabled states are successful contracts, not unsupported requests.
  assert.equal(proxy.events.at(-1).category, "local-bridge");
  assert.equal(config.events.at(-1).outcome, "success");
});

test("verified host requests forward once and preserve backend failures", async () => {
  for (const response of [
    { status: 200, body: { origins: [], homeDir: "C:/test" } },
    { status: 400, body: { error: "Access denied", rpcError: { code: -32000 } } }
  ]) {
    const f = fixture(undefined, response);
    const { replies, events } = await f.dispatch(hostFetch(
      "vscode://codex/git-origins", { dirs: ["C:/test"] }));
    const calls = f.calls.filter(call => call.url === "/__bridge/host-fetch");
    assert.equal(calls.length, 1);
    assert.deepEqual(JSON.parse(calls[0].options.body),
      { request: "git-origins", params: { dirs: ["C:/test"] } });
    assert.equal(replies[0].status, response.status);
    assert.deepEqual(JSON.parse(replies[0].bodyJsonString), response.body);
    // Errors remain errors, including nonempty CLI error details.
    assert.equal(events.at(-1).outcome, response.status < 400 ? "success" : "error");
  }
});

test("real CLI methods no longer have a parallel demo implementation", () => {
  // Removing dead simulated state prevents a future refactor reviving fake conversations.
  assert.doesNotMatch(source, /demoMcpMethods|demoThreads|saveThreads|codex-browser-demo-threads/);
  const f = fixture();
  for (const method of ["thread/start", "thread/list", "turn/start", "config/read"]) {
    assert.equal(f.realMethods.has(method), true);
  }
});
