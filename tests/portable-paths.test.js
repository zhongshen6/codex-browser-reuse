const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const vm = require("node:vm");
const { createRequire } = require("node:module");

const project = path.resolve(__dirname, "..");
// Preserve server-relative module resolution while simulating a moved __dirname.
const serverRequire = createRequire(path.join(project, "server.js"));
const serverSource = fs.readFileSync(path.join(project, "server.js"), "utf8");
const bootstrapEnd = serverSource.indexOf("const mime =");
assert.ok(bootstrapEnd > 0, "Server bootstrap boundary changed");

function bootstrap(directory, env = {}) {
  // Evaluate only path declarations: no HTTP listener, CLI, or real state writes.
  const context = vm.createContext({
    __dirname: directory, require: serverRequire,
    process: { env, platform: "win32" }, console
  });
  return vm.runInContext(
    serverSource.slice(0, bootstrapEnd) +
      "\n({ root, workspaceRoot, extensionsRoot, extensionsConfigPath, codexHome, codexExe })",
    context
  );
}

test("project-owned paths follow relocation rather than the caller working directory", () => {
  // Neither location needs to exist: path resolution must not depend on contents.
  for (const directory of [
    path.join(os.tmpdir(), "codex-relocated"),
    path.join(os.tmpdir(), "folder with spaces", "codex-relocated")
  ]) {
    const state = bootstrap(directory);
    assert.equal(state.workspaceRoot, path.resolve(directory));
    assert.equal(state.root,
      path.join(directory, "runtime", "codex-frontend-26.917.9434", "webview"));
    assert.equal(state.extensionsConfigPath, path.join(directory, "extensions", "config.json"));
    assert.notEqual(state.workspaceRoot, process.cwd());
  }
});

test("machine-level CLI and user state overrides survive relocation", () => {
  // Relocating the bridge must never relocate account credentials or sessions.
  const env = {
    CODEX_HOME: path.join(os.tmpdir(), "external-codex-home"),
    CODEX_BIN: path.join(os.tmpdir(), "external-cli", "codex.exe")
  };
  const state = bootstrap(path.join(os.tmpdir(), "moved-bridge"), env);
  assert.equal(state.codexHome, env.CODEX_HOME);
  assert.equal(state.codexExe, env.CODEX_BIN);
});

test("packaged renderer and extension assets are contained in the project", () => {
  // Check actual deployment files, not only declarations in the source.
  const state = bootstrap(project);
  assert.ok(fs.existsSync(path.join(state.root, "index.html")));
  assert.ok(fs.existsSync(state.extensionsConfigPath));
  assert.ok(fs.existsSync(path.join(state.extensionsRoot, "themes", "nahida", "runtime.js")));
});
