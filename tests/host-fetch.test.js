const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const os = require("node:os");
const { promisify } = require("node:util");
const { execFile } = require("node:child_process");
const { createHash } = require("node:crypto");
const { createHostFetch } = require("../src/host-fetch");
const execute = promisify(execFile);

function fixture({ files = new Map(), overrides = {} } = {}) {
  const requests = [];
  const handle = createHostFetch({
    codexHome: path.resolve("test-codex-home"), homeDir: os.homedir(),
    resolvePath: value => {
      if (!value) throw new Error("path is required");
      return path.resolve(value);
    },
    execFile: execute, gitAvailable: async () => true, projectRoots: () => [],
    settings: () => ({ "ambient-suggestions-enabled": true }),
    rpc: async request => {
      requests.push(request);
      if (request.method === "fs/createDirectory") return { result: {} };
      const content = files.get(request.params.path);
      if (content === undefined) return { error: { code: -32000, message: "os error 2" } };
      // Fixtures use the exported CLI protocol, including base64 file contents.
      return { result: request.method === "fs/getMetadata" ? { isFile: true } :
        { dataBase64: Buffer.from(content).toString("base64") } };
    },
    ...overrides
  });
  return { handle, requests };
}

test("directory creation is forwarded to CLI and never duplicated locally", async () => {
  const { handle, requests } = fixture();
  assert.deepEqual(await handle("ensure-directory", { path: "./new-folder" }), {});
  assert.deepEqual(requests.map(({ method, params }) => ({ method, params })), [{
    method: "fs/createDirectory", params: { path: path.resolve("new-folder"), recursive: true }
  }]);
  assert.match(requests[0].id, /^host-fetch-/);
});

test("CLI errors, unsupported hosts and excluded features remain explicit", async () => {
  const { handle } = fixture({ overrides: {
    rpc: async () => ({ error: { code: -32000, message: "permission denied" } })
  } });
  await assert.rejects(handle("ensure-directory", { path: "./new-folder" }),
    error => error.code === "CLI_REQUEST_FAILED" && error.rpcError.code === -32000);
  await assert.rejects(handle("ensure-directory", { hostId: "remote", path: "./new-folder" }),
    { code: "BRIDGE_UNSUPPORTED_HOST" });
  // These categories are intentionally outside this repair, not fake empty lists.
  for (const name of ["list-automations", "inbox-items", "external-agent-import-status"]) {
    await assert.rejects(handle(name), { code: "BRIDGE_UNSUPPORTED_REQUEST" });
  }
});

test("keymap reads actual overrides and official renamed commands", async () => {
  const file = path.resolve("test-codex-home", "keybindings.json");
  const { handle, requests } = fixture({ files: new Map([[file, JSON.stringify([
    { command: "newThread", key: "Ctrl+N" },
    { command: "closeTabOrWindow", key: null }
  ])]]) });
  const state = await handle("codex-command-keymap-state");
  assert.equal(state.keymapPath, file);
  assert.deepEqual(state.bindings, [
    { command: "newTask", key: "Ctrl+N" },
    { command: "closeTab", key: null }, { command: "closeWindow", key: null }
  ]);
  assert.deepEqual(requests.map(request => request.method), ["fs/getMetadata", "fs/readFile"]);
  // Missing files mean official defaults; the renderer supplies those defaults.
  const missing = await fixture().handle("codex-command-keymap-state");
  assert.deepEqual(missing.bindings, []);
});

test("mail provider uses MX results and a bounded lookup", async () => {
  const handle = fixture({ overrides: {
    dnsLookup: async domain => [{ exchange: domain, priority: 10 }]
  } }).handle;
  assert.deepEqual(await handle("email-domain-mail-provider", { domain: "aspmx.l.google.com" }),
    { provider: "google" });
  assert.deepEqual(await handle("email-domain-mail-provider", { domain: "example.protection.outlook.com" }),
    { provider: "microsoft" });
  assert.deepEqual(await handle("email-domain-mail-provider", { domain: "notgoogle.com" }),
    { provider: "other" });
  // A hanging resolver cannot block initialization indefinitely.
  const timeout = fixture({ overrides: {
    dnsLookup: () => new Promise(() => {}), dnsTimeoutMs: 5
  } }).handle;
  assert.deepEqual(await timeout("email-domain-mail-provider", { domain: "example.test" }),
    { provider: "other" });
});

test("ambient suggestions read the desktop cache without generating model work", async () => {
  const root = path.resolve("test-project");
  const hash = createHash("sha1").update("local").update("\0").update(root).digest("hex");
  const file = path.resolve("test-codex-home", "ambient-suggestions", hash, "ambient-suggestions.json");
  const cache = { projectRoot: root, generatedAtMs: 123, currentSuggestionIds: ["one"],
    suggestions: [{ id: "one", title: "Existing suggestion" }] };
  const { handle, requests } = fixture({ files: new Map([[file, JSON.stringify(cache)]]) });
  assert.deepEqual(await handle("ambient-suggestions", { projectRoot: root }), { file: cache });
  assert.ok(requests.every(request => request.method.startsWith("fs/")));
});

test("real Git origins and worktree shell config match desktop contracts", async t => {
  try { await execute("git", ["--version"]); }
  catch { t.skip("System Git is optional"); return; }
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "codex-host-fetch-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await execute("git", ["init", "-q", root]);
  await execute("git", ["-C", root, "remote", "add", "origin", "https://example.test/repository.git"]);
  const sub = path.join(root, "nested");
  await fs.mkdir(sub);
  // Temporary repositories avoid changing the user's branches or remotes.
  const files = new Map();
  const { handle } = fixture({ files, overrides: { projectRoots: () => [root] } });
  const result = await handle("git-origins", { dirs: [root, sub, sub] });
  assert.equal(result.origins.length, 2);
  assert.equal(result.origins[0].originUrl, "https://example.test/repository.git");
  assert.equal(path.resolve(result.origins[1].root), root);
  assert.equal(path.resolve(result.origins[0].commonDir), path.join(root, ".git"));
  const configPath = (await execute("git", ["-C", root, "rev-parse",
    "--path-format=absolute", "--git-path", "codex-shell-environment.json"])).stdout.trim();
  const environment = { version: 1, set: { DEMO: "one" }, exclude: ["SECRET"] };
  files.set(configPath, JSON.stringify(environment));
  assert.deepEqual(await handle("worktree-shell-environment-config", { cwd: sub }),
    { shellEnvironment: environment });
  files.set(configPath, JSON.stringify({ version: 2, set: {}, exclude: [] }));
  assert.deepEqual(await handle("worktree-shell-environment-config", { cwd: root }),
    { shellEnvironment: null });
});

test("missing Git truthfully disables origins and shell environment", async () => {
  const { handle, requests } = fixture({ overrides: { gitAvailable: async () => false } });
  assert.deepEqual(await handle("git-origins"),
    { origins: [], homeDir: os.homedir(), available: false });
  assert.deepEqual(await handle("worktree-shell-environment-config", { cwd: "./" }),
    { shellEnvironment: null });
  // Disabling Git must not execute filesystem or model requests.
  assert.deepEqual(requests, []);
});
