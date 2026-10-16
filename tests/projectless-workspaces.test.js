const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const fsp = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const vm = require("node:vm");
const { createProjectlessWorkspaces, projectlessDirectoryName,
  projectlessDateDirectory } = require("../src/projectless-workspaces");
const { createThreadProjectState } = require("../src/thread-project-state");
const { createHostFetch } = require("../src/host-fetch");

function fixture(t, overrides = {}) {
  // Keep directory and state tests away from the user's actual CODEX_HOME.
  // All recursive cleanup targets are checked against the temporary-directory parent.
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "codex-projectless-"));
  t.after(() => {
    assert.equal(path.dirname(root), path.resolve(os.tmpdir()));
    fs.rmSync(root, { recursive: true, force: true });
  });
  let settings = {};
  const workspace = createProjectlessWorkspaces({
    settings: () => settings, homeDirectory: root,
    now: () => new Date(2026, 9, 11, 12), ...overrides
  });
  const filePath = path.join(root, ".codex", ".codex-global-state.json");
  const state = createThreadProjectState({ filePath });
  return { root, workspace, state, filePath, settings: value => { settings = value; } };
}

test("official naming uses prompt words, explicit names and the local date", () => {
  // Non-ASCII-only prompts intentionally use the desktop's new-chat fallback.
  // A locale change must not introduce a different filename-generation algorithm.
  assert.equal(projectlessDirectoryName({ prompt: "\u65b0\u5efa\u4f1a\u8bdd" }), "new-chat");
  assert.equal(projectlessDirectoryName({ prompt: "One TWO three 4 five six seven" }),
    "one-two-three-4-five-six");
  assert.equal(projectlessDirectoryName({ directoryName: "One Two Three Four Five Six Seven",
    prompt: "ignored" }), "one-two-three-four-five-six-seven");
  assert.equal(projectlessDirectoryName({ directoryName: "", prompt: "ignored" }), "new-chat");
  assert.equal(projectlessDirectoryName({ prompt: "a".repeat(200) }).length, 80);
  assert.equal(projectlessDateDirectory(new Date(2026, 0, 2, 23)), "2026-01-02");
});

test("default allocation separates cwd, root and output without changing cwd to work", async t => {
  const f = fixture(t);
  const expectedRoot = path.join(f.root, "Documents", "Codex");
  // Merely querying the root must not create a directory.
  // This query runs during frontend startup even when the user creates no chat.
  assert.deepEqual(await f.workspace.workspaceRoot(), expectedRoot);
  assert.equal(fs.existsSync(expectedRoot), false);
  const result = await f.workspace.allocate({ prompt: "Hello world" });
  const cwd = path.join(expectedRoot, "2026-10-11", "hello-world");
  assert.deepEqual(result, { cwd, workspaceRoot: expectedRoot,
    outputDirectory: path.join(cwd, "outputs") });
  assert.ok(fs.statSync(path.join(cwd, "work")).isDirectory());
  assert.ok(fs.statSync(result.outputDirectory).isDirectory());
  assert.deepEqual(f.workspace.pathsForCwd(cwd), result);
});

test("unsplit tasks and concurrent repeated prompts get exclusive chat directories", async t => {
  const f = fixture(t);
  const results = await Promise.all(Array.from({ length: 8 }, () =>
    f.workspace.allocate({ directoryName: "Repeated", createSplitDirectories: false })));
  // Exclusive mkdir is tested concurrently, not only through sequential numbering.
  // Passing sequential tests alone would not detect a shared-directory race.
  assert.equal(new Set(results.map(result => result.cwd)).size, 8);
  assert.deepEqual(results.map(result => path.basename(result.cwd)).sort(),
    ["repeated", ...Array.from({ length: 7 }, (_, index) => `repeated-${index + 2}`)].sort());
  for (const result of results) {
    assert.equal(result.outputDirectory, result.cwd);
    assert.deepEqual(fs.readdirSync(result.cwd), []);
  }
});

test("full numeric range switches to the official unique-suffix attempts", async t => {
  const f = fixture(t, { uniqueSuffix: () => "unique" });
  const date = path.join(f.workspace.root(), "2026-10-11");
  fs.mkdirSync(date, { recursive: true });
  for (let index = 0; index < 100; index += 1) {
    fs.mkdirSync(path.join(date, index === 0 ? "new-chat" : `new-chat-${index + 1}`));
  }
  // The first nonnumeric candidate is used only after all 100 names collide.
  // This boundary guards against changing the official suffix numbering.
  const result = await f.workspace.allocate();
  assert.equal(path.basename(result.cwd), "new-chat-unique");
});

test("configuration is read fresh and resetting it affects only new allocations", async t => {
  const f = fixture(t);
  const original = await f.workspace.allocate();
  const custom = path.join(f.root, "custom-root");
  f.settings({ projectlessWorkspaceRoot: custom });
  const changed = await f.workspace.allocate();
  assert.equal(changed.workspaceRoot, custom);
  assert.equal(await f.workspace.resolveSelectedDirectory(custom), custom);
  f.settings({});
  const restored = await f.workspace.allocate();
  assert.equal(restored.workspaceRoot, original.workspaceRoot);
  assert.notEqual(restored.cwd, original.cwd);
  assert.ok(fs.existsSync(changed.outputDirectory));
  // Existing allocation metadata is not rewritten when the setting changes.
  // Old chat files must stay accessible after the default root moves elsewhere.
  assert.deepEqual(f.workspace.pathsForCwd(changed.cwd), changed);
});

test("relative roots, file roots and unknown hosts fail without using program cwd", async t => {
  const f = fixture(t);
  f.settings({ projectlessWorkspaceRoot: "relative-path" });
  await assert.rejects(f.workspace.allocate(), /must be absolute/);
  const file = path.join(f.root, "not-a-directory");
  fs.writeFileSync(file, "");
  f.settings({ projectlessWorkspaceRoot: file });
  await assert.rejects(f.workspace.workspaceRoot(), /real directory/);
  f.settings({});
  await assert.rejects(f.workspace.allocate({ hostId: "remote" }),
    { code: "BRIDGE_UNSUPPORTED_HOST" });
  // Host rejection happens before root creation or any disk side effect.
  // A remote request must not accidentally create a local projectless workspace.
  assert.equal(fs.existsSync(f.workspace.root()), false);
});

test("symlink roots and date directories are rejected like the official host", async t => {
  const f = fixture(t);
  const target = path.join(f.root, "target");
  const link = path.join(f.root, "link");
  fs.mkdirSync(target);
  // Directory junctions do not require Windows developer-mode symlink privileges.
  // Both the configured root and the per-day entry need their own link checks.
  fs.symlinkSync(target, link, process.platform === "win32" ? "junction" : "dir");
  f.settings({ projectlessWorkspaceRoot: link });
  await assert.rejects(f.workspace.allocate(), /real directory/);
  f.settings({ projectlessWorkspaceRoot: target });
  fs.symlinkSync(target, path.join(target, "2026-10-11"),
    process.platform === "win32" ? "junction" : "dir");
  await assert.rejects(f.workspace.allocate(), /real directory/);
});

test("split-directory failure returns the chat directory and fatal mkdir errors propagate", async t => {
  const failing = Object.assign(new Error("denied"), { code: "EACCES" });
  let workCreated;
  const f = fixture(t, { fileSystem: {
    ...fsp,
    mkdir: async (value, options) => {
      if (path.basename(value) === "outputs") throw failing;
      if (path.basename(value) === "work") {
        workCreated = fsp.mkdir(value, options);
        return workCreated;
      }
      return fsp.mkdir(value, options);
    }
  } });
  const result = await f.workspace.allocate();
  // The desktop preserves the successfully allocated chat on split failure.
  // Returning an error here would diverge from its usable unsplit fallback.
  assert.equal(result.outputDirectory, result.cwd);
  // Promise.all may reject before its sibling mkdir completes; wait before cleanup.
  // The wait belongs to the test, not a change to the official allocation policy.
  await workCreated;
  const fatal = fixture(t, { fileSystem: { ...fsp, mkdir: async () => { throw failing; } } });
  await assert.rejects(fatal.workspace.allocate(), { code: "EACCES" });
});

test("desktop path requests use the real allocator and propagate unsupported hosts", async t => {
  const f = fixture(t);
  const handle = createHostFetch({ projectlessWorkspaces: f.workspace });
  assert.deepEqual(await handle("projectless-workspace-root"),
    { workspaceRoot: f.workspace.root() });
  const result = await handle("projectless-thread-cwd", { prompt: "host request" });
  assert.equal(path.basename(result.cwd), "host-request");
  assert.ok(fs.existsSync(result.outputDirectory));
  await assert.rejects(handle("projectless-workspace-root", { hostId: "remote" }),
    { code: "BRIDGE_UNSUPPORTED_HOST" });
});

test("projectless metadata survives a new store and preserves unrelated official state", async t => {
  const f = fixture(t);
  fs.mkdirSync(path.dirname(f.filePath), { recursive: true });
  fs.writeFileSync(f.filePath, JSON.stringify({
    "pinned-thread-ids": ["unrelated"], "local-projects": { existing: { name: "project" } },
    "thread-project-assignments": { chat: { projectKind: "local", projectId: "wrong" } }
  }));
  const generated = await f.workspace.allocate();
  const updated = f.state.updateProjectlessThread({ threadId: "chat", projectless: true,
    workspaceRoot: generated.workspaceRoot, outputDirectory: generated.outputDirectory });
  assert.deepEqual(updated.projectlessThreadIds, ["chat"]);
  assert.equal(updated.threadAssignments.chat, undefined);
  // A fresh instance models backend restart rather than checking an in-memory cache.
  // Preservation assertions also prevent accidentally replacing all app state.
  assert.deepEqual(createThreadProjectState({ filePath: f.filePath }).read(), updated);
  const raw = JSON.parse(fs.readFileSync(f.filePath, "utf8"));
  assert.deepEqual(raw["pinned-thread-ids"], ["unrelated"]);
  assert.equal(raw["local-projects"].existing.name, "project");
  assert.equal(raw["thread-projectless-output-directories"].chat, generated.outputDirectory);
});

test("partial hints and assignment changes preserve other chats and use explicit membership", t => {
  const f = fixture(t);
  const second = createThreadProjectState({ filePath: f.filePath });
  f.state.updateProjectlessThread({ threadId: "one", projectless: true });
  second.updateProjectlessThread({ threadId: "two", projectless: true });
  const root = path.join(f.root, "hint");
  f.state.updateProjectlessThread({ threadId: "one", workspaceRoot: root });
  assert.deepEqual(f.state.read().projectlessThreadIds, ["one", "two"]);
  // Assigning a chat removes only its own no-project marker.
  // A second client verifies that mutations reread disk instead of stale snapshots.
  f.state.setAssignments([{ threadId: "one",
    assignment: { projectKind: "local", projectId: "project" } }]);
  assert.deepEqual(second.read().projectlessThreadIds, ["two"]);
  assert.equal(second.read().threadAssignments.one.projectId, "project");
  assert.equal(second.read().threadWorkspaceRootHints.one, root);
});

test("removal clears hints and ignores late metadata writes without resurrecting a chat", t => {
  const f = fixture(t);
  f.state.updateProjectlessThread({ threadId: "one", projectless: true,
    workspaceRoot: f.root, outputDirectory: f.root });
  f.state.updateProjectlessThread({ threadId: "one", projectless: false, outputDirectory: null });
  f.state.updateProjectlessThread({ threadId: "one", outputDirectory: f.root });
  f.state.updateProjectlessThread({ threadId: "one", projectless: true });
  // This is the official service's delayed-write protection, not deletion of files.
  // Membership cleanup is never permission to delete the conversation's workspace.
  assert.deepEqual(f.state.read().projectlessThreadIds, []);
  assert.deepEqual(f.state.read().threadWorkspaceRootHints, {});
  assert.deepEqual(f.state.read().threadProjectlessOutputDirectories, {});
  assert.ok(fs.existsSync(f.root));
});

test("invalid state mutations and corrupt disk state never partially overwrite the file", t => {
  const f = fixture(t);
  f.state.updateProjectlessThread({ threadId: "safe", projectless: true });
  const before = fs.readFileSync(f.filePath, "utf8");
  assert.throws(() => f.state.updateProjectlessThread({ threadId: "bad",
    projectless: true, workspaceRoot: "relative" }), /absolute path/);
  assert.throws(() => f.state.setAssignments([
    { threadId: "safe", assignment: { projectId: "valid" } },
    { threadId: "", assignment: null }
  ]), /threadId/);
  assert.throws(() => f.state.setGlobalState("pinned-thread-ids", []), /Unsupported/);
  assert.equal(fs.readFileSync(f.filePath, "utf8"), before);
  // A parse failure must not convert existing metadata into an empty document.
  // Invalid edits are checked against unchanged bytes, not just a thrown error.
  fs.writeFileSync(f.filePath, "{bad json");
  assert.throws(() => f.state.updateProjectlessThread({ threadId: "new", projectless: true }));
  assert.equal(fs.readFileSync(f.filePath, "utf8"), "{bad json");
});

test("official renderer membership service writes backend state and restores path hints", async t => {
  const f = fixture(t);
  const source = fs.readFileSync(path.join(__dirname, "../src/bridge.js"), "utf8");
  const replies = [];
  const globalState = new Map();
  // Exercise production methods in isolation from the full Electron RPC handshake.
  // Only HTTP and Windows transport are mocked; ownership logic stays real.
  const context = vm.createContext({
    injectedAssignments: {}, injectedProjectlessThreadIds: [], globalState,
    projectState: { project: {} }, reply: value => replies.push(value),
    fetch: async (_url, options) => {
      let state;
      if (options.method === "GET") state = f.state.read();
      else {
        const body = JSON.parse(options.body);
        state = body.operation === "setAssignments" ? f.state.setAssignments(body.entries) :
          f.state.updateProjectlessThread(body.params);
      }
      return { ok: true, json: async () => state };
    }
  });
  const stateStart = source.indexOf("  let threadAssignments =");
  const stateEnd = source.indexOf("  const assignmentForProject =", stateStart);
  const serviceStart = source.indexOf("      const readAssignmentArgs =");
  const serviceEnd = source.indexOf("      const threadReadStateChanged =", serviceStart);
  vm.runInContext(source.slice(stateStart, stateEnd) + source.slice(serviceStart, serviceEnd) +
    "\nglobalThis.service = threadProjectAssignments;", context);
  await context.service.updateProjectlessThread({
    threadId: "browser-chat", projectless: true, workspaceRoot: f.root, outputDirectory: f.root
  });
  assert.deepEqual(f.state.read().projectlessThreadIds, ["browser-chat"]);
  assert.equal(globalState.get("thread-workspace-root-hints")["browser-chat"], f.root);
  assert.equal(globalState.get("thread-projectless-output-directories")["browser-chat"], f.root);
  assert.equal(replies.at(-1).type, "global-state-updated");
  // The same official service remains responsible for moving a chat into a project.
  // Switching ownership must update backend state as well as the current sidebar.
  await context.service.setAssignment({ threadId: "browser-chat",
    assignment: { projectKind: "local", projectId: "project" } });
  assert.equal(f.state.read().threadAssignments["browser-chat"].projectId, "project");
  assert.deepEqual(f.state.read().projectlessThreadIds, []);
});

test("allocated or explicitly projectless threads never inherit a containing project", () => {
  const source = fs.readFileSync(path.join(__dirname, "../src/server.js"), "utf8");
  const root = path.resolve("containing-project");
  const generatedCwd = path.join(root, "tasks", "new-chat");
  const project = { id: "containing", rootPaths: [root] };
  const state = { projectlessThreadIds: [], threadAssignments: {} };
  // Exercise the actual enrichment functions; no server, browser or model is started.
  // The generated root sits inside a project to reproduce the original misclassification.
  const context = vm.createContext({
    projectState: state, projects: [project], projectsById: new Map([[project.id, project]]),
    projectlessWorkspaces: { pathsForCwd: value => value === generatedCwd ? {} : undefined },
    canonicalPath: value => value ? path.resolve(value) : null,
    isPathWithin: (candidate, parent) => {
      const relative = path.relative(parent, candidate);
      return relative === "" || (!path.isAbsolute(relative) && !relative.startsWith(".."));
    }
  });
  const start = source.indexOf("function projectIdForThread(");
  const end = source.indexOf("function enrichAppServerResponse(", start);
  vm.runInContext(source.slice(start, end), context);
  assert.equal(context.projectIdForThread({ id: "new", cwd: generatedCwd }), null);
  state.projectlessThreadIds = ["saved"];
  assert.equal(context.enrichThread({ id: "saved", cwd: root, projectId: project.id }).projectId, null);
  // Moving into a project is still an explicit membership operation, not a cwd move.
  state.threadAssignments.new = { projectKind: "local", projectId: project.id };
  assert.equal(context.projectIdForThread({ id: "new", cwd: generatedCwd }), project.id);
  assert.equal(context.projectIdForThread({ id: "ordinary", cwd: root }), project.id);
});
