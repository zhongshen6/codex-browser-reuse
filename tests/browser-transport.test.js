const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { createDeployment } = require("../src/deployment");

function fixture(basePath) {
  const deployment = createDeployment(basePath);
  const calls = [];
  const location = new URL(`https://example.test${basePath}local/thread`);
  const window = {
    __codexBrowserBasePath: basePath,
    __codexBrowserCsrfToken: "test-session-csrf",
    fetch: async (input, options) => {
      calls.push({ input, options });
      return { status: 204 };
    }
  };
  const context = vm.createContext({ window, location, URL, Request, Headers });
  const project = path.join(__dirname, "..");
  // Test the served bytes, not merely source literals: rewriting caused this regression.
  vm.runInContext(deployment.rewriteResources(
    fs.readFileSync(path.join(project, "src", "browser-paths.js"), "utf8")), context);
  const source = fs.readFileSync(path.join(project, "src", "bridge.js"), "utf8");
  // Isolate production transport before the rest of the renderer installs listeners.
  const transport = source.slice(0, source.indexOf("  // LAN HTTP"));
  vm.runInContext(deployment.rewriteResources(transport) + "\n})();", context);
  return { window, calls };
}

test("served bridge transport adds CSRF once for root and mounted deployments", async () => {
  for (const basePath of ["/", "/codex/", "/nested/codex/"]) {
    const { window, calls } = fixture(basePath);
    const mounted = `${basePath}__bridge/message`;
    for (const input of ["/__bridge/message", mounted, new URL(mounted, "https://example.test")]) {
      const headers = { "content-type": "application/json" };
      await window.fetch(input, { method: "POST", headers, body: "{}" });
      const call = calls.at(-1);
      assert.equal(new URL(call.input).pathname, mounted);
      assert.equal(call.options.headers.get("x-codex-csrf"), "test-session-csrf");
      assert.equal(call.options.body, "{}");
      assert.equal(headers["x-codex-csrf"], undefined);
    }
    assert.equal(window.__codexBrowserInitialRoute, "/local/thread");
    assert.equal(window.__codexBrowserPaths.publicPath(mounted), mounted);
  }
});

test("Request method and options survive path and CSRF adaptation", async () => {
  const { window, calls } = fixture("/codex/");
  const request = new Request("https://example.test/__bridge/message", {
    method: "POST", headers: { "content-type": "application/json" },
    credentials: "include", body: '{"type":"test"}'
  });
  await window.fetch(request);
  const call = calls.at(-1);
  assert.equal(call.input.url, "https://example.test/codex/__bridge/message");
  assert.equal(call.input.method, "POST");
  assert.equal(call.input.credentials, "include");
  assert.equal(call.options.headers.get("x-codex-csrf"), "test-session-csrf");
  assert.equal(await call.input.text(), '{"type":"test"}');
});

test("external and read-only requests never receive the session CSRF token", async () => {
  const { window, calls } = fixture("/codex/");
  const headers = { "content-type": "application/json" };
  const external = new Request("https://other.test/__bridge/message", { method: "POST" });
  await window.fetch(external, { headers });
  // External identity is preserved and no secrets leak into its headers.
  assert.equal(calls.at(-1).input, external);
  assert.equal(calls.at(-1).options.headers, headers);
  for (const [input, method] of [
    ["/__bridge/status", "GET"], ["/__bridge/status", "HEAD"],
    ["/__bridge/status", "OPTIONS"], ["/assets/test.js", "POST"]
  ]) {
    await window.fetch(input, { method, headers });
    assert.equal(calls.at(-1).options.headers, headers);
  }
});
