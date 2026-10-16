const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { adaptAgentImportRenderer } = require("../src/renderer-agent-import-adapter");

const project = path.resolve(__dirname, "..");
const source = fs.readFileSync(
  path.join(project, "runtime/codex-frontend-26.917.9434/webview/assets/app-initial-fc9a33fdda88.js"), "utf8"
);
const plugin = fs.readFileSync(
  path.join(project, "extensions/plugins/disable-agent-import/runtime.js"), "utf8"
);

test("agent import adapter pins every official query source", () => {
  const adapted = adaptAgentImportRenderer(source);
  assert.notEqual(adapted, source);
  assert.match(adapted, /__codexBrowserDisableAgentImport/);
  assert.match(adapted, /External agent import is disabled/);
  for (const name of ["IKo", "LKo", "RKo", "zKo", "BKo", "Jqo"]) {
    assert.match(adapted, new RegExp(`${name}=`), name);
  }
});

test("agent import runtime blocks only its own host paths", () => {
  const context = vm.createContext({ window: {}, location: { href: "http://localhost/" }, URL });
  vm.runInContext(plugin, context);
  const policy = context.window.__codexBrowserExtensionPolicy;
  assert.equal(policy.beforeFetchRequest(new URL("/external-agent-import-status", context.location.href)).blocked, true);
  assert.equal(policy.beforeFetchRequest(new URL("/workspace-directory-entries", context.location.href)), null);
  context.window.__codexBrowserDisableAgentImportRuntime.dispose();
  assert.equal(context.window.__codexBrowserExtensionPolicy, undefined);
});

test("disabled agent import is independently switched from automation", () => {
  const config = JSON.parse(fs.readFileSync(path.join(project, "extensions/config.json"), "utf8"));
  assert.equal(config.plugins["disable-agent-import"], true);
  assert.equal(config.plugins["disable-automations"], true);
});
