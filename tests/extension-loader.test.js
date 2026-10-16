const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { createExtensionLoader } = require("../src/extension-loader");

const project = path.resolve(__dirname, "..");
const extensionRoot = path.join(project, "extensions");
const configPath = path.join(extensionRoot, "config.json");

function loaderFor(config) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "codex-extension-config-"));
  const filename = path.join(directory, "config.json");
  fs.writeFileSync(filename, JSON.stringify(config));
  return {
    loader: createExtensionLoader({ root: extensionRoot, configPath: filename }),
    cleanup: () => fs.rmSync(directory, { recursive: true, force: true })
  };
}

test("extension loader discovers packages and emits only enabled runtime assets", () => {
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  const { loader } = loaderFor(config);
  const manifests = loader.discover();
  const ids = manifests.map(extension => `${extension.group}/${extension.id}`);
  assert.ok(ids.includes("plugins/mobile-viewport"));
  assert.ok(ids.includes("plugins/external-network-guard"));
  assert.ok(ids.includes("plugins/attachment-controls"));
  assert.ok(ids.includes("themes/nahida"));

  const tags = loader.runtimeTags({ publicPath: value => `/codex${value}` });
  assert.match(tags, /\/codex\/__extensions\/plugins\/mobile-viewport\/style\.css/);
  assert.match(tags, /\/codex\/__extensions\/plugins\/browser-attachments\/runtime\.js/);
  assert.doesNotMatch(tags, /themes\/nahida/);
});

test("disabled extension assets are inaccessible and enabled theme assets use its server adapter", () => {
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  config.themes.nahida = true;
  const { loader, cleanup } = loaderFor(config);
  try {
    const asset = loader.resolveAssetRequest(
      "/__extensions/themes/nahida/theme.css"
    );
    assert.ok(asset);
    const source = fs.readFileSync(asset.filename);
    const transformed = loader.transformAsset(asset, source).toString();
    assert.doesNotMatch(transformed, /__NHD_[A-Z_]+_DATA__/);
    assert.match(transformed, /data:image\/svg\+xml;base64/);
  } finally {
    cleanup();
  }

  const disabled = loaderFor(JSON.parse(fs.readFileSync(configPath, "utf8")));
  try {
    assert.equal(
      disabled.loader.resolveAssetRequest(
        "/__extensions/themes/nahida/theme.css"
      ),
      null
    );
  } finally {
    disabled.cleanup();
  }
});

test("source-level adapters remain outside ordinary plugin manifests", () => {
  const { loader } = loaderFor(JSON.parse(fs.readFileSync(configPath, "utf8")));
  for (const extension of loader.discover()) {
    assert.equal(extension.bundleAdapters, undefined);
  }
  for (const filename of [
    "src/renderer-attachment-adapter.js",
    "src/renderer-file-adapter.js",
    "src/renderer-panel-adapter.js",
    "src/renderer-automation-adapter.js"
  ]) {
    assert.ok(fs.existsSync(path.join(project, filename)), filename);
  }
});
