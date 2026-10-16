const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { spawnSync } = require("node:child_process");
const { verifyDependencies } = require("../tools/verify-dependencies");

const project = path.resolve(__dirname, "..");
const windows = process.platform === "win32";
const powershell = path.join(process.env.SystemRoot || "C:\\Windows",
  "System32", "WindowsPowerShell", "v1.0", "powershell.exe");

function fixture(t) {
  // A moved fixture contains dependencies only, never credentials or user sessions.
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "codex bundled runtime "));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  for (const name of ["runtime/node", "node_modules/smol-toml"]) {
    fs.cpSync(path.join(project, name), path.join(directory, name), { recursive: true });
  }
  for (const name of ["runtime/dependencies.json", "package.json", "package-lock.json",
    "tools/verify-dependencies.js", "tools/bundled-runtime.ps1", "install.ps1"]) {
    // Preserve nested helper paths in relocated installations.
    fs.mkdirSync(path.dirname(path.join(directory, name)), { recursive: true });
    fs.copyFileSync(path.join(project, name), path.join(directory, name));
  }
  return directory;
}

test("the bundled runtime and dependency agree with their manifest and lockfile",
  { skip: !windows }, () => {
    const result = verifyDependencies();
    assert.equal(result.node, "v24.21.0");
    assert.deepEqual(result.packages, { "smol-toml": "1.9.0" });
  });

test("offline setup works after relocation without system Node or npm",
  { skip: !windows }, t => {
    const directory = fixture(t);
    // Remove external Node/npm/Git directories from the child environment only.
    const result = spawnSync(powershell, ["-NoProfile", "-ExecutionPolicy", "Bypass",
      "-File", path.join(directory, "install.ps1")], {
      cwd: os.tmpdir(), encoding: "utf8", timeout: 30000,
      env: { ...process.env, PATH: path.join(process.env.SystemRoot, "System32") }
    });
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.match(result.stdout, /Bundled dependencies verified/);
    assert.ok(result.stdout.includes(directory));
  });

test("a missing private runtime is not silently replaced by the system Node",
  { skip: !windows }, t => {
    const directory = fixture(t);
    // Only mutate the isolated fixture; the original runtime remains untouched.
    fs.unlinkSync(path.join(directory, "runtime", "node", "node.exe"));
    const result = spawnSync(powershell, ["-NoProfile", "-ExecutionPolicy", "Bypass",
      "-File", path.join(directory, "install.ps1")], {
      cwd: os.tmpdir(), encoding: "utf8", timeout: 30000
    });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Bundled Node is missing/);
  });

test("dependency corruption is diagnosed instead of downloading replacements",
  { skip: !windows }, t => {
    const directory = fixture(t);
    // Corruption must be detected before loading the package in the live backend.
    fs.appendFileSync(path.join(directory, "node_modules", "smol-toml", "dist", "index.cjs"), "\n");
    assert.throws(() => verifyDependencies(directory), /Bundled dependency mismatch/);
  });
