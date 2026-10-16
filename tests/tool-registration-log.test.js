const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const vm = require("node:vm");
const { createToolRegistrationLog, describeDynamicTools } = require("../src/tool-registration-log");

const project = path.resolve(__dirname, "..");

function fixture(t, options = {}) {
  // Test output belongs to an isolated directory, never the active backend logs.
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "codex-tool-audit-"));
  const errors = [];
  // flush() makes assertions deterministic without sleeps or live backend polling.
  const logger = createToolRegistrationLog({ directory,
    onError: error => errors.push(error), ...options });
  t.after(async () => {
    await logger.flush();
    fs.rmSync(directory, { recursive: true, force: true });
  });
  return { logger, directory, errors, read: () =>
    fs.readFileSync(logger.file, "utf8").trim().split("\n").map(line => JSON.parse(line)) };
}

function request(tools) {
  // Sentinel values detect accidentally logging a whole RPC instead of its tool definitions.
  return { id: 0, method: "thread/start", params: {
    dynamicTools: tools,
    input: [{ type: "text", text: "PRIVATE MESSAGE" }],
    developerInstructions: "PRIVATE INSTRUCTIONS",
    config: { api_key: "PRIVATE CREDENTIAL" }
  } };
}

test("dynamic tool audit distinguishes missing, null, empty and invalid declarations", () => {
  // The states are evidence about the request, not assertions about restored tools.
  assert.deepEqual(describeDynamicTools({ params: {} }), { state: "absent" });
  assert.deepEqual(describeDynamicTools({ params: { dynamicTools: null } }), { state: "null" });
  assert.deepEqual(describeDynamicTools({ params: { dynamicTools: [] } }),
    { state: "empty", count: 0, tools: [] });
  assert.deepEqual(describeDynamicTools({ params: { dynamicTools: "invalid" } }),
    { state: "invalid", valueType: "string" });
  assert.equal(describeDynamicTools({ params: { dynamicTools: [null] } }).tools[0].invalid, true);
});

test("audit snapshots received and submitted definitions, correlates responses and omits messages", async t => {
  const f = fixture(t);
  // This is a synthetic declaration, not evidence that a real CUA tool is currently loaded.
  const original = request([{ name: "mcp__cua_repl__js", namespace: "cua_repl",
    description: "Execute a client tool", deferLoading: true,
    inputSchema: { type: "object", properties: { code: { type: "string" } } } }]);
  const trace = f.logger.begin(original, { source: "browser-rpc" });
  // Later adaptation must not rewrite evidence of what the browser originally sent.
  original.params.dynamicTools[0].name = "changed";
  trace.submitted({ ...original, params: {} });
  trace.responded({ result: { thread: { id: "created-thread" } } });
  await f.logger.flush();
  const rows = f.read();
  assert.deepEqual(rows.map(row => row.event), ["received", "cli-submitted", "cli-response"]);
  assert.equal(new Set(rows.map(row => row.traceId)).size, 1);
  // A valid JSON-RPC id of zero must not be discarded as a falsy missing identifier.
  assert.equal(rows[0].source, "browser-rpc");
  assert.equal(rows[0].requestId, 0);
  assert.equal(rows[0].dynamicTools.tools[0].name, "mcp__cua_repl__js");
  // Tool schemas must remain complete enough to identify exactly what was registered.
  assert.deepEqual(rows[0].dynamicTools.tools[0].inputSchema,
    { type: "object", properties: { code: { type: "string" } } });
  assert.equal(rows[1].dynamicTools.state, "absent");
  // Successful thread creation supplies the ID that was not yet known at ingress.
  assert.equal(rows[2].threadId, "created-thread");
  assert.equal(rows[2].outcome, "request-succeeded");
  assert.doesNotMatch(JSON.stringify(rows), /PRIVATE/);
  assert.deepEqual(f.errors, []);
});

test("resume requests record absence without claiming the old tool registry is empty", async t => {
  const f = fixture(t);
  const trace = f.logger.begin({ id: "resume", method: "thread/resume",
    params: { threadId: "existing-thread" } }, { source: "browser-rpc" });
  trace.responded({ result: {} });
  await f.logger.flush();
  // A resumed thread can have saved tools even though this particular request omits them.
  assert.equal(f.read()[0].dynamicTools.state, "absent");
  assert.equal(f.read()[1].threadId, "existing-thread");
});

test("unrelated requests are skipped but unexpected dynamic tool fields are captured", async t => {
  const f = fixture(t);
  // Avoid writing a registration record for every normal message, polling RPC or setting.
  assert.equal(f.logger.begin({ id: 1, method: "turn/start", params: { input: [] } }), null);
  assert.equal(f.logger.begin({ id: 2, method: "config/read" }), null);
  assert.equal(fs.existsSync(f.logger.file), false);
  f.logger.begin({ id: 3, method: "turn/start", params: { dynamicTools: [] } });
  await f.logger.flush();
  assert.equal(f.read()[0].dynamicTools.state, "empty");
});

test("rejected and failed registrations log a terminal outcome only once", async t => {
  const f = fixture(t);
  const rejected = f.logger.begin(request([]));
  rejected.responded({ error: { code: -32602, message: "PRIVATE CREDENTIAL" } });
  rejected.failed("late-error");
  const failed = f.logger.begin(request([]));
  failed.failed("rpc-timeout");
  failed.responded({ result: {} });
  await f.logger.flush();
  const terminal = f.read().filter(row => row.event !== "received");
  // A timeout and a late response cannot create contradictory final outcomes.
  assert.equal(terminal.length, 2);
  assert.equal(terminal[0].outcome, "request-rejected");
  assert.equal(terminal[0].errorCode, -32602);
  assert.equal(terminal[1].reason, "rpc-timeout");
  assert.doesNotMatch(JSON.stringify(terminal), /PRIVATE|late-error/);
});

test("rotation retains one bounded history segment without breaking JSONL records", async t => {
  const f = fixture(t, { maxBytes: 1 });
  for (let index = 0; index < 3; index++) {
    f.logger.begin({ id: index, method: "thread/start", params: {} });
  }
  await f.logger.flush();
  // Oversized individual records stay intact; only the preceding segment is kept.
  assert.equal(f.read()[0].requestId, 2);
  assert.equal(JSON.parse(fs.readFileSync(f.logger.file + ".1", "utf8")).requestId, 1);
  assert.equal(fs.existsSync(f.logger.file + ".2"), false);
});

test("audit I/O failures are reported without rejecting or poisoning the request queue", async t => {
  const f = fixture(t);
  // A file at the log-directory path reproduces a persistent filesystem failure.
  fs.rmSync(f.directory, { recursive: true });
  fs.writeFileSync(f.directory, "not a directory");
  f.logger.begin(request([])).failed("initialization-failed");
  await assert.doesNotReject(f.logger.flush());
  assert.equal(f.errors.length, 2);
  // Repair the fixture and verify the same queue recovers rather than staying rejected.
  fs.rmSync(f.directory);
  fs.mkdirSync(f.directory);
  f.logger.begin(request([]));
  await f.logger.flush();
  assert.equal(f.read()[0].event, "received");
});

test("production RPC forwarding records browser source and actual adapted CLI payloads", async t => {
  const f = fixture(t);
  const source = fs.readFileSync(path.join(project, "src", "server.js"), "utf8");
  const start = source.indexOf("const appServerParamKeys =");
  const end = source.indexOf("// CLI events own the notification lifecycle", start);
  const pending = new Map();
  const writes = [];
  const generated = { cwd: path.join(project, "test-projectless", "new-chat"),
    workspaceRoot: path.join(project, "test-projectless"),
    outputDirectory: path.join(project, "test-projectless", "new-chat", "outputs") };
  // No real model, native browser or registered MCP server is invoked by this fixture.
  // Run the real adapter and dispatcher, mocking only the initialized CLI transport.
  const context = vm.createContext({
    workspaceRoot: project, projectsById: new Map(), events: [],
    rpcReady: Promise.resolve(), pendingRpc: pending, toolRegistrationLog: f.logger,
    // The allocator/storage are host boundaries, not part of tool-catalog logging.
    projectlessWorkspaces: {
      allocate: async () => generated,
      pathsForCwd: value => value === generated.cwd ? generated : undefined
    },
    projectState: {}, threadProjectStore: { updateProjectlessThread: () => ({}) },
    enrichAppServerResponse: (_method, message) => message,
    setTimeout: () => 1, clearTimeout: () => {},
    appServer: { stdin: { write(line) {
      const sent = JSON.parse(line);
      writes.push(sent);
      queueMicrotask(() => pending.get(String(sent.id)).resolve({
        id: sent.id, result: { thread: { id: "cli-thread" } }
      }));
    } } }
  });
  vm.runInContext(source.slice(start, end), context);
  const declaration = request([{ name: "client-test", inputSchema: { type: "object" } }]);
  const before = JSON.stringify(declaration);
  await context.callAppServer(declaration, { source: "browser-rpc" });
  await context.callAppServer({ ...declaration, id: "resume",
    method: "thread/resume" }, { source: "browser-rpc" });
  await f.logger.flush();
  const rows = f.read();
  assert.equal(rows[0].source, "browser-rpc");
  assert.deepEqual(writes[0].params.dynamicTools, declaration.params.dynamicTools);
  assert.equal(writes[0].params.cwd, generated.cwd);
  assert.equal(rows[1].dynamicTools.tools[0].name, "client-test");
  assert.equal(rows[2].threadId, "cli-thread");
  assert.equal(rows[3].dynamicTools.state, "provided");
  // Resume adaptation currently drops this field; the audit must expose both stages.
  assert.equal(rows[4].dynamicTools.state, "absent");
  assert.equal(JSON.stringify(declaration), before);
  // Verify the HTTP ingress labels its origin rather than using the backend default.
  assert.match(source, /callAppServer\(message\.request, \{ source: "browser-rpc" \}\)/);
});
