const { test } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const zlib = require("node:zlib");
const { createStaticResponder, acceptedEncodings } = require("../src/static-responses");
const { createDeployment, loadDeployment } = require("../src/deployment");
const { createExtensionLoader } = require("../src/extension-loader");
const { BUILD_ASSETS, BUILD_INPUTS, FRONTEND_ROOT, buildContext, transformFrontend } = require("../src/frontend-assets");
const { BUILD_DIRECTORY, createPrebuiltFrontend } = require("../src/prebuilt-frontend");
const { buildFrontend, ensureFrontendBuild } = require("../tools/build-frontend");

const project = path.resolve(__dirname, "..");
// Multilingual content catches accidental encoding conversion in all variants.
const source = 'export const message = "\u4e2d\u6587 English"; fetch("/__bridge/rpc");\n'.repeat(1200);
const transform = (_name, text, deployment) => deployment.rewriteResources(text);

function fixture(t, realAssets = false) {
  // Every destructive cleanup is confined to this newly allocated test tree.
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "codex-frontend-build-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  for (const name of BUILD_INPUTS) {
    fs.mkdirSync(path.dirname(path.join(root, name)), { recursive: true });
    fs.copyFileSync(path.join(project, name), path.join(root, name));
  }
  // Copy manifests only: these tests need configuration, not theme media.
  const realLoader = createExtensionLoader({
    root: path.join(project, "extensions"), configPath: path.join(project, "extensions/config.json")
  });
  // Declared defaults must be tested alongside explicit local configuration.
  for (const extension of realLoader.discover()) {
    const relative = `extensions/${extension.group}/${extension.id}/manifest.json`;
    fs.mkdirSync(path.dirname(path.join(root, relative)), { recursive: true });
    fs.copyFileSync(path.join(project, relative), path.join(root, relative));
  }
  fs.copyFileSync(path.join(project, "extensions/config.json"), path.join(root, "extensions/config.json"));
  fs.mkdirSync(path.join(root, "config"), { recursive: true });
  fs.writeFileSync(path.join(root, "config/server.json"), JSON.stringify({ basePath: "/codex/" }));
  fs.mkdirSync(path.join(root, FRONTEND_ROOT, "assets"), { recursive: true });
  for (const name of BUILD_ASSETS) {
    // Synthetic data makes invalidation tests cheap; one test uses real bundles.
    const relative = `${FRONTEND_ROOT}/assets/${name}`;
    if (realAssets) fs.copyFileSync(path.join(project, relative), path.join(root, relative));
    else fs.writeFileSync(path.join(root, relative), source);
  }
  const loader = createExtensionLoader({
    root: path.join(root, "extensions"), configPath: path.join(root, "extensions/config.json")
  });
  return {
    root, loader,
    asset: name => path.join(root, FRONTEND_ROOT, "assets", name || BUILD_ASSETS[0]),
    build: () => buildFrontend(root, realAssets ? {} : { transform }),
    context: () => buildContext(loadDeployment(root), loader)
  };
}

async function httpFixture(t, app) {
  // Keep production CLI, ports, sessions and the user's browser out of tests.
  const deployment = loadDeployment(app.root);
  const responder = createStaticResponder({ projectRoot: app.root, deployment, extensionLoader: app.loader });
  let filename = app.asset();
  let headers = { "content-type": "text/javascript", "cache-control": "no-store" };
  let fallbacks = 0;
  const server = http.createServer((request, response) => {
    try {
      const stat = fs.statSync(filename);
      if (responder.sendPrebuilt(request, response, filename, stat, headers)) return;
      fallbacks++;
      // Simulate the server's current-byte adaptation without any codec.
      responder.sendBuffer(request, response, transform(filename, fs.readFileSync(filename, "utf8"), deployment), headers);
    } catch (error) {
      response.writeHead(500);
      response.end(error.message);
    }
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  return {
    setFile(value) { filename = value; },
    setHeaders(value) { headers = value; },
    fallbacks: () => fallbacks,
    request(encoding, method = "GET", extraHeaders = {}) {
      return new Promise((resolve, reject) => {
        // Raw HTTP leaves encoded bytes untouched, unlike fetch's decoding.
        const request = http.request({
          host: "127.0.0.1", port: server.address().port, path: "/", method, agent: false,
          headers: { ...extraHeaders, ...(encoding === undefined ? {} : { "accept-encoding": encoding }) }
        }, response => {
          const chunks = [];
          response.on("data", chunk => chunks.push(chunk));
          response.on("error", reject);
          response.on("end", () => resolve({
            status: response.statusCode, headers: response.headers, body: Buffer.concat(chunks)
          }));
        });
        request.on("error", reject);
        request.end();
      });
    }
  };
}

test("encoding negotiation respects weights, wildcard and explicit identity", () => {
  // Rejected and malformed codec weights must not broaden client permissions.
  for (const [header, encoding, identityAllowed] of [
    [undefined, null, true], ["gzip, br", "br", true], ["gzip;q=1, br;q=0.4", "gzip", true],
    ["br;q=0, *;q=0.5", "gzip", true], ["identity;q=1, gzip;q=0.5", null, true],
    ["identity;q=0, gzip", "gzip", false], ["*;q=0", null, false], ["br;q=garbage", null, true]
  ]) assert.deepEqual(acceptedEncodings(header), { encoding, identityAllowed });
  // Negotiate only codecs that actually exist on disk.
  assert.equal(acceptedEncodings("br, gzip", ["gzip"]).encoding, "gzip");
});

test("prepared assets preserve final adapted bytes, negotiation, HEAD and cache policy", async t => {
  const app = fixture(t);
  await app.build();
  const web = await httpFixture(t, app);
  const expected = Buffer.from(createDeployment("/codex/").rewriteResources(source));
  // Identity clients must receive adapted content, not the unpatched bundle.
  for (const [accept, encoding, decode] of [
    ["br, gzip", "br", zlib.brotliDecompressSync], ["gzip", "gzip", zlib.gunzipSync],
    [undefined, undefined, value => value], ["identity;q=1, br;q=0.5", undefined, value => value]
  ]) {
    // Compare bytes rather than just decoded strings to detect UTF-8 changes.
    const result = await web.request(accept);
    assert.equal(result.status, 200);
    assert.equal(result.headers["content-encoding"], encoding);
    assert.equal(result.headers["content-length"], String(result.body.length));
    assert.equal(result.headers["cache-control"], "no-store");
    assert.equal(result.headers.vary, "Accept-Encoding");
    assert.deepEqual(decode(result.body), expected);
  }
  const get = await web.request("br");
  // HEAD must neither send a body nor advertise the decoded resource size.
  const head = await web.request("br", "HEAD");
  assert.equal(head.headers["content-length"], get.headers["content-length"]);
  assert.equal(head.headers["content-encoding"], "br");
  assert.equal(head.body.length, 0);
  assert.equal((await web.request("*;q=0")).status, 406);
  // Successful prepared reads must never enter the adaptation fallback.
  assert.equal(web.fallbacks(), 0);
});

test("startup reuses valid artifacts and rebuilds once when inputs change", async t => {
  const app = fixture(t);
  let builds = 0;
  const build = async () => { builds++; return app.build(); };
  assert.deepEqual(await ensureFrontendBuild(app.root, { build }), { rebuilt: true });
  const manifestPath = path.join(app.root, BUILD_DIRECTORY, "manifest.json");
  const before = fs.statSync(manifestPath).mtimeMs;
  // Repeated startup checks must not rewrite or recompress valid output.
  for (let i = 0; i < 3; i++) {
    assert.deepEqual(await ensureFrontendBuild(app.root, { build }), { rebuilt: false });
  }
  assert.equal(builds, 1);
  // Matching startup checks leave existing output timestamps completely intact.
  assert.equal(fs.statSync(manifestPath).mtimeMs, before);
  fs.appendFileSync(app.asset(), "// changed\n");
  assert.deepEqual(await ensureFrontendBuild(app.root, { build }), { rebuilt: true });
  assert.equal(builds, 2);
});

test("runtime source changes fall back to plain bytes and a manual build is detected", async t => {
  const app = fixture(t);
  await app.build();
  const web = await httpFixture(t, app);
  // Change size as well as timestamp to avoid coarse filesystem-clock ambiguity.
  fs.appendFileSync(app.asset(), "// newer source\n");
  const stale = await web.request("br");
  assert.equal(stale.headers["content-encoding"], undefined);
  assert.ok(stale.body.toString().endsWith("// newer source\n"));
  assert.equal((await web.request("br, identity;q=0")).status, 406);
  // A running reader must notice the atomically replaced manifest after rebuild.
  // No request creates artifacts; only the explicit build repairs the mismatch.
  await app.build();
  const fresh = await web.request("br");
  assert.equal(fresh.headers["content-encoding"], "br");
  assert.deepEqual(zlib.brotliDecompressSync(fresh.body), stale.body);
});

test("adapter and core-switch changes invalidate output but runtime-only switches do not", async t => {
  const app = fixture(t);
  await app.build();
  const reader = createPrebuiltFrontend(app.root);
  // Reuse the reader instance to exercise configuration changes without restart.
  const lookup = () => reader.lookup(app.asset(), fs.statSync(app.asset()), app.context());
  const configPath = path.join(app.root, "extensions/config.json");
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  // A decorative theme switch should not force recompressing unrelated bundles.
  config.themes.nahida = !config.themes.nahida;
  fs.writeFileSync(configPath, JSON.stringify(config));
  assert.ok(lookup());
  // Only private source hooks participate in bundle configuration identity.
  config.plugins["right-panel"] = !config.plugins["right-panel"];
  fs.writeFileSync(configPath, JSON.stringify(config));
  assert.equal(lookup(), null);
  await app.build();
  assert.ok(lookup());
  fs.appendFileSync(path.join(app.root, BUILD_INPUTS[1]), "// adapter change\n");
  // Source hooks and deployment paths invalidate independently of resource size.
  assert.equal(lookup(), null);
  assert.equal(reader.lookup(app.asset(), fs.statSync(app.asset()),
    { ...app.context(), basePath: "/" }), null);
});

test("missing artifacts trigger startup repair and plain runtime fallback", async t => {
  const app = fixture(t);
  const manifest = await app.build();
  const entry = manifest.assets[`${FRONTEND_ROOT}/assets/${BUILD_ASSETS[0]}`];
  // Removing a single codec is sufficient to make the startup build incomplete.
  fs.unlinkSync(path.join(app.root, BUILD_DIRECTORY, entry.files.br.name));
  const web = await httpFixture(t, app);
  // A missing preferred codec can use another accepted prepared representation.
  assert.equal((await web.request("br, gzip")).headers["content-encoding"], "gzip");
  assert.equal((await web.request("br")).headers["content-encoding"], undefined);
  assert.deepEqual(await ensureFrontendBuild(app.root, { build: () => app.build() }), { rebuilt: true });
  assert.equal((await web.request("br")).headers["content-encoding"], "br");
  // A removed manifest must invalidate even a reader that cached the old index.
  fs.unlinkSync(path.join(app.root, BUILD_DIRECTORY, "manifest.json"));
  assert.equal((await web.request("br")).headers["content-encoding"], undefined);
});

test("range and no-transform bypass prepared compression; nonselected assets remain plain", async t => {
  const app = fixture(t);
  await app.build();
  const web = await httpFixture(t, app);
  assert.equal((await web.request("br", "GET", { range: "bytes=0-10" })).headers["content-encoding"], undefined);
  web.setHeaders({ "content-type": "text/javascript", "cache-control": "public, NO-TRANSFORM", vary: "Origin" });
  const result = await web.request("br");
  assert.equal(result.headers["content-encoding"], undefined);
  assert.equal(result.headers.vary, "Origin, Accept-Encoding");
  const other = path.join(path.dirname(app.asset()), "other.js");
  fs.writeFileSync(other, source);
  web.setFile(other);
  // Even a large text asset stays plain when not on the fixed build list.
  web.setHeaders({ "content-type": "text/javascript" });
  assert.equal((await web.request("br")).headers["content-encoding"], undefined);
});

test("prepared manifest paths remain relative and invalid paths cannot escape the build", async t => {
  const app = fixture(t);
  const manifest = await app.build();
  assert.ok(!JSON.stringify(manifest).includes(app.root));
  // Do not trust a corrupted index to choose a file outside the output directory.
  const key = `${FRONTEND_ROOT}/assets/${BUILD_ASSETS[0]}`;
  manifest.assets[key].files.br.name = "../../secret";
  fs.writeFileSync(path.join(app.root, BUILD_DIRECTORY, "manifest.json"), JSON.stringify(manifest));
  const reader = createPrebuiltFrontend(app.root);
  assert.equal(reader.lookup(app.asset(), fs.statSync(app.asset()), app.context()), null);
});

test("all actual official startup bundles round-trip after shared browser adapters", async t => {
  const app = fixture(t, true);
  const manifest = await app.build();
  const deployment = loadDeployment(app.root);
  // Real exported bundles validate the pinned private-closure adaptations too.
  for (const name of BUILD_ASSETS) {
    const entry = manifest.assets[`${FRONTEND_ROOT}/assets/${name}`];
    const expected = Buffer.from(transformFrontend(name, fs.readFileSync(app.asset(name), "utf8"),
      deployment, app.context()));
    for (const [encoding, decode] of [
      ["identity", value => value], ["gzip", zlib.gunzipSync], ["br", zlib.brotliDecompressSync]
    ]) {
      // Each codec must contain all browser adaptations, not only routing changes.
      const bytes = fs.readFileSync(path.join(app.root, BUILD_DIRECTORY, entry.files[encoding].name));
      assert.deepEqual(decode(bytes), expected);
    }
  }
  // The adapted router must survive precompression, not revert to official bytes.
  const initial = manifest.assets[`${FRONTEND_ROOT}/assets/${BUILD_ASSETS[0]}`];
  assert.match(fs.readFileSync(path.join(app.root, BUILD_DIRECTORY, initial.files.identity.name), "utf8"),
    /window\.__codexBrowserRouteChanged/);
});

test("HTTP code contains no runtime codec or large-byte hashing path", () => {
  // Guard against accidentally reintroducing first-request compression later.
  const responder = fs.readFileSync(path.join(project, "src/static-responses.js"), "utf8");
  assert.doesNotMatch(responder, /node:zlib|createHash|promisify|compressBuffer|encodedBody/);
  const server = fs.readFileSync(path.join(project, "src/server.js"), "utf8");
  // Startup checking must complete before the listening socket becomes available.
  assert.ok(server.indexOf("await ensureFrontendBuild(projectRoot)") < server.indexOf('server.listen(port, "0.0.0.0"'));
});
