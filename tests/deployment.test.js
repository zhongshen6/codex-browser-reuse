const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { createDeployment, loadDeployment, normalizeBasePath } = require("../src/deployment");

test("deployment paths normalize root and reverse-proxy mounts", () => {
  assert.equal(normalizeBasePath("/"), "/");
  assert.equal(normalizeBasePath("/codex"), "/codex/");
  assert.equal(normalizeBasePath("/codex/"), "/codex/");
  assert.throws(() => normalizeBasePath("https://example.test/codex/"));
  assert.throws(() => normalizeBasePath("/codex/?query"));
  assert.throws(() => normalizeBasePath("/codex//nested/"));

  const root = createDeployment("/");
  assert.equal(root.publicPath("/__bridge/status"), "/__bridge/status");
  assert.equal(root.internalPath("/__bridge/status"), "/__bridge/status");

  const mounted = createDeployment("/codex/");
  assert.equal(mounted.publicPath("/"), "/codex/");
  assert.equal(mounted.publicPath("/__bridge/status"), "/codex/__bridge/status");
  assert.equal(mounted.publicPath("/codex/__bridge/status"), "/codex/__bridge/status");
  assert.equal(mounted.publicPath("/codex/"), "/codex/");
  assert.equal(mounted.publicPath("/codex-other/file"), "/codex/codex-other/file");
  assert.equal(mounted.internalPath("/codex/"), "/");
  assert.equal(mounted.internalPath("/codex/local/thread"), "/local/thread");
  assert.equal(mounted.internalPath("/outside/local/thread"), null);
});

test("mounted resources rewrite only local root namespaces", () => {
  const deployment = createDeployment("/codex/");
  const source = [
    '<script src="/assets/app.js"></script>',
    '<link href="/__bridge/browser-viewport.css">',
    'url("/images/icon.png")',
    'fetch("/__bridge/rpc")',
    'fetch("https://example.test/__bridge/not-local")',
    'const route = "/local/thread";'
  ].join("\n");
  const result = deployment.rewriteResources(source);
  assert.match(result, /\/codex\/assets\/app\.js/);
  assert.match(result, /\/codex\/__bridge\/browser-viewport\.css/);
  assert.match(result, /\/codex\/images\/icon\.png/);
  assert.match(result, /\/codex\/__bridge\/rpc/);
  assert.match(result, /https:\/\/example\.test\/__bridge\/not-local/);
  assert.match(result, /const route = "\/local\/thread"/);
});

test("server deployment config is portable and environment override is explicit", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "codex-deployment-"));
  try {
    fs.mkdirSync(path.join(directory, "config"));
    fs.writeFileSync(path.join(directory, "config", "server.json"),
      JSON.stringify({ basePath: "/from-file/" }));
    assert.equal(loadDeployment(directory).basePath, "/from-file/");
    assert.equal(loadDeployment(directory, { CODEX_BROWSER_BASE_PATH: "/from-env" }).basePath,
      "/from-env/");
  } finally {
    // The directory is a test-owned temporary tree, not project or user data.
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
