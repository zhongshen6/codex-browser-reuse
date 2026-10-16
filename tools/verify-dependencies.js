const fs = require("node:fs");
const path = require("node:path");
const { createHash } = require("node:crypto");
const { createRequire } = require("node:module");

// Resolve against the project, never a user's globally installed Node packages.
function verifyDependencies(project = path.resolve(__dirname, "..")) {
  const readJson = file => JSON.parse(fs.readFileSync(file, "utf8"));
  const manifest = readJson(path.join(project, "runtime", "dependencies.json"));
  const declared = readJson(path.join(project, "package.json")).dependencies || {};
  const lock = readJson(path.join(project, "package-lock.json"));
  const node = path.join(project, manifest.node.path);
  const sha256 = file => createHash("sha256").update(fs.readFileSync(file)).digest("hex");

  // Pin the private runtime so a machine's PATH cannot change execution semantics.
  if (process.version !== manifest.node.version || process.platform !== manifest.node.platform ||
      process.arch !== manifest.node.arch || sha256(node) !== manifest.node.sha256) {
    throw new Error("Bundled Node version, architecture, or checksum mismatch.");
  }
  if (!fs.existsSync(path.join(project, manifest.node.license))) {
    throw new Error("Bundled Node license is missing.");
  }
  // Reject incomplete upgrades instead of loading an accidentally global dependency.
  if (JSON.stringify(Object.keys(declared).sort()) !==
      JSON.stringify(Object.keys(manifest.packages).sort())) {
    throw new Error("Bundled dependency list does not match package.json.");
  }
  const localRequire = createRequire(path.join(project, "package.json"));
  for (const [name, dependency] of Object.entries(manifest.packages)) {
    const directory = path.join(project, dependency.path);
    const metadata = readJson(path.join(directory, "package.json"));
    const entry = path.join(directory, dependency.entry);
    if (metadata.version !== dependency.version || declared[name] !== dependency.version ||
        lock.packages[dependency.path]?.version !== dependency.version ||
        sha256(entry) !== dependency.entrySha256 ||
        fs.realpathSync(localRequire.resolve(name)) !== fs.realpathSync(entry)) {
      throw new Error(`Bundled dependency mismatch: ${name}`);
    }
    // Licenses travel with the runnable source tree, including third-party packages.
    if (!fs.existsSync(path.join(directory, dependency.license))) {
      throw new Error(`Bundled dependency license is missing: ${name}`);
    }
    localRequire(name);
  }
  return { node: process.version, platform: process.platform, arch: process.arch,
    packages: Object.fromEntries(Object.entries(manifest.packages)
      .map(([name, dependency]) => [name, dependency.version])) };
}

// The same offline verifier is used by installation, startup, and tests.
module.exports = { verifyDependencies };
if (require.main === module) {
  try { console.log(JSON.stringify(verifyDependencies())); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
