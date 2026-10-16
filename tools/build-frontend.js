const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");
const { createHash, randomUUID } = require("node:crypto");
const { promisify } = require("node:util");
const { loadDeployment } = require("../src/deployment");
const { createExtensionLoader } = require("../src/extension-loader");
const {
  FRONTEND_ROOT, BUILD_ASSETS, BUILD_INPUTS, buildContext, transformFrontend
} = require("../src/frontend-assets");
const { BUILD_DIRECTORY, fileStamp, sameStamp, createPrebuiltFrontend } = require("../src/prebuilt-frontend");

async function buildFrontend(projectRoot, { assetNames = BUILD_ASSETS, transform = transformFrontend } = {}) {
  const deployment = loadDeployment(projectRoot);
  const loader = createExtensionLoader({
    root: path.join(projectRoot, "extensions"),
    configPath: path.join(projectRoot, "extensions/config.json")
  });
  const context = buildContext(deployment, loader);
  const output = path.join(projectRoot, BUILD_DIRECTORY);
  // Source metadata describes the local installation, not a frontend version.
  const inputs = Object.fromEntries(BUILD_INPUTS.map(name => [name, fileStamp(path.join(projectRoot, name))]));
  const assets = {};
  fs.mkdirSync(output, { recursive: true });
  // Persist artifacts before publishing the manifest; readers see a complete build.
  for (const name of assetNames) {
    const relative = `${FRONTEND_ROOT}/assets/${name}`;
    const filename = path.join(projectRoot, relative);
    const input = fileStamp(filename);
    // Compress the bytes actually served in browsers, including mount rewrites.
    const body = Buffer.from(transform(name, fs.readFileSync(filename, "utf8"), deployment, context), "utf8");
    // Hashing occurs only while building; HTTP handlers never hash these bodies.
    const hash = createHash("sha256").update(body).digest("hex");
    const files = {};
    const variants = [
      ["identity", "raw", body],
      ["gzip", "gz", await promisify(zlib.gzip)(body, { level: 6 })],
      ["br", "br", await promisify(zlib.brotliCompress)(body, {
        params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 4 }
      })]
    ];
    // Both codecs are prepared once, avoiding later per-client codec work.
    // Write atomically even when a running backend is serving an earlier build.
    for (const [encoding, extension, bytes] of variants) {
      const artifact = `${hash}.${extension}`;
      const temporary = path.join(output, `${artifact}.${randomUUID()}.tmp`);
      fs.writeFileSync(temporary, bytes);
      fs.renameSync(temporary, path.join(output, artifact));
      files[encoding] = { name: artifact, size: bytes.length };
    }
    assets[relative] = { input, files };
  }
  // Do not publish a build if someone changed its inputs while it was running.
  for (const [name, stamp] of Object.entries(inputs)) {
    if (!sameStamp(stamp, fileStamp(path.join(projectRoot, name)))) throw new Error(`Build input changed: ${name}`);
  }
  for (const [name, entry] of Object.entries(assets)) {
    if (!sameStamp(entry.input, fileStamp(path.join(projectRoot, name)))) throw new Error(`Asset changed: ${name}`);
  }
  if (JSON.stringify(context) !== JSON.stringify(buildContext(loadDeployment(projectRoot), loader))) {
    throw new Error("Frontend configuration changed during build");
  }
  const manifest = { format: 1, context, inputs, assets };
  // Replacing this small index publishes all seven resources as one build.
  const temporary = path.join(output, `manifest.${randomUUID()}.tmp`);
  fs.writeFileSync(temporary, JSON.stringify(manifest, null, 2) + "\n");
  fs.renameSync(temporary, path.join(output, "manifest.json"));
  // Delete only recognized artifacts inside this fixed build directory.
  const keep = new Set(["manifest.json", ...Object.values(assets).flatMap(entry =>
    Object.values(entry.files).map(file => file.name))]);
  for (const name of fs.readdirSync(output)) {
    if (/^[a-f0-9]{64}\.(raw|gz|br)$/.test(name) && !keep.has(name)) {
      fs.unlinkSync(path.join(output, name));
    }
  }
  return manifest;
}

async function ensureFrontendBuild(projectRoot, { build = buildFrontend } = {}) {
  const deployment = loadDeployment(projectRoot);
  const loader = createExtensionLoader({
    root: path.join(projectRoot, "extensions"),
    configPath: path.join(projectRoot, "extensions/config.json")
  });
  const context = buildContext(deployment, loader);
  // The reader uses relative paths and the same freshness rules as HTTP.
  const prepared = createPrebuiltFrontend(projectRoot);
  // One startup check covers every expected artifact, including missing codecs.
  const current = BUILD_ASSETS.every(name => {
    try {
      const filename = path.join(projectRoot, FRONTEND_ROOT, "assets", name);
      const files = prepared.lookup(filename, fs.statSync(filename), context);
      return files?.identity && files.gzip && files.br;
    } catch { return false; }
  });
  if (current) return { rebuilt: false };
  // Startup owns rebuilding; HTTP requests only read prepared files.
  await build(projectRoot);
  return { rebuilt: true };
}

if (require.main === module) {
  const projectRoot = path.resolve(__dirname, "..");
  // Manual rebuilds use the same implementation as startup's stale-build repair.
  buildFrontend(projectRoot).then(manifest => {
    for (const [name, entry] of Object.entries(manifest.assets)) {
      console.log(`${path.basename(name)}: ${entry.files.identity.size} -> gzip ${entry.files.gzip.size}, br ${entry.files.br.size}`);
    }
    console.log("Frontend build ready. No backend restart is required to read new artifacts.");
  }).catch(error => { console.error(error.message); process.exitCode = 1; });
}

module.exports = { buildFrontend, ensureFrontendBuild };
