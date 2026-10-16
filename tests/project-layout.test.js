const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const project = path.resolve(__dirname, "..");
const exists = name => fs.existsSync(path.join(project, name));

test("root contains entry scripts and manifests, not scattered source modules", () => {
  // Keep this contract explicit so future additions do not repopulate the root.
  const names = fs.readdirSync(project);
  assert.deepEqual(names.filter(name => /\.(js|css)$/i.test(name)), []);
  for (const name of ["README.md", "package.json", "package-lock.json",
    "start-backend.ps1", "stop-backend.ps1", "restart-backend.ps1",
    "status-backend.ps1", "install.ps1"]) {
    assert.ok(exists(name), `Missing project entry: ${name}`);
  }
});

test("source modules, native helpers and browser styles retain their dependencies", () => {
  // Check disk paths without running a CLI, sending notifications or opening Explorer.
  for (const name of ["src/server.js", "src/bridge.js", "src/deployment.js",
    "src/lan-login.css", "src/extension-loader.js",
    "src/core-extension-adapters.js",
    "extensions/plugins/mobile-viewport/runtime.js",
    "extensions/plugins/mobile-viewport/style.css",
    "extensions/plugins/browser-attachments/runtime.js",
    "extensions/plugins/browser-attachments/manifest.json",
    "extensions/plugins/right-panel/runtime.js",
    "extensions/themes/nahida/manifest.json",
    "tools/verify-dependencies.js", "tools/focus-explorer.ps1",
    "tools/windows-notifications.ps1", "tools/test.ps1"]) {
    assert.ok(exists(name), `Missing runtime or maintenance file: ${name}`);
  }
  const manifest = JSON.parse(fs.readFileSync(path.join(project, "package.json"), "utf8"));
  assert.equal(manifest.scripts.start, "node src/server.js");
});

test("reports and maintenance tools stay separate from application startup", () => {
  // Retain project regression reports without mixing them into executable tests.
  assert.equal(fs.readdirSync(path.join(project, "tests")).some(name => name.endsWith(".md")), false);
  assert.ok(exists("docs/testing/notification-regression-report.md"));
  // Maintenance helpers support bridge diagnostics and reproducible preview fixtures.
  assert.ok(exists("tools/bridge-stats.js"));
  assert.ok(exists("tools/create-preview-fixtures.js"));
});
