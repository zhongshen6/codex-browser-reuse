const fs = require("node:fs");
const path = require("node:path");

const GROUPS = ["plugins", "themes"];
const SAFE_ID = /^[a-z0-9][a-z0-9-]*$/;

function createExtensionLoader({ root, configPath }) {
  const manifestCache = new Map();
  const moduleCache = new Map();

  // Manifests describe browser scripts and assets, not source-level patches.
  // The core renderer adapters remain the only owners of private module hooks.
  function readManifest(group, id) {
    if (!SAFE_ID.test(group) || !SAFE_ID.test(id)) {
      throw new Error(`Invalid extension name: ${group}/${id}`);
    }
    const key = `${group}/${id}`;
    if (manifestCache.has(key)) return manifestCache.get(key);
    const directory = path.join(root, group, id);
    const filename = path.join(directory, "manifest.json");
    const manifest = JSON.parse(fs.readFileSync(filename, "utf8"));
    if (manifest.id !== id || manifest.group !== group) {
      throw new Error(`Extension manifest identity mismatch: ${key}`);
    }
    if (manifest.bundleAdapters !== undefined) {
      throw new Error(`Source patches cannot be registered as plugins: ${key}`);
    }
    if (manifest.coreAdapter !== undefined && typeof manifest.coreAdapter !== "boolean") {
      throw new Error(`Invalid core adapter marker: ${key}`);
    }
    // Validate resource names before they can become HTML attributes or paths.
    for (const field of ["runtime", "style", "assets"]) {
      const values = manifest[field] === undefined ? []
        : Array.isArray(manifest[field]) ? manifest[field] : [manifest[field]];
      for (const value of values) validateResourceName(value);
    }
    if (manifest.serverAdapter) validateResourceName(manifest.serverAdapter);
    const normalized = {
      ...manifest,
      id,
      group,
      directory,
      order: Number.isFinite(manifest.order) ? manifest.order : 100,
      defaultEnabled: manifest.defaultEnabled === true
    };
    manifestCache.set(key, normalized);
    return normalized;
  }

  function discover() {
    // Only immediate child directories are packages; do not recurse into assets.
    return GROUPS.flatMap(group => {
      const directory = path.join(root, group);
      if (!fs.existsSync(directory)) return [];
      return fs.readdirSync(directory, { withFileTypes: true })
        .filter(entry => entry.isDirectory() && SAFE_ID.test(entry.name))
        .map(entry => readManifest(group, entry.name));
    });
  }

  function readConfig() {
    const raw = JSON.parse(fs.readFileSync(configPath, "utf8"));
    const known = discover();
    const knownKeys = new Set(known.map(extension => `${extension.group}/${extension.id}`));
    // A misspelled switch must not silently leave a plugin enabled.
    for (const group of Object.keys(raw)) {
      if (!GROUPS.includes(group)) throw new Error(`Unknown extension group: ${group}`);
    }
    for (const group of GROUPS) {
      if (raw[group] !== undefined &&
          (raw[group] === null || typeof raw[group] !== "object" || Array.isArray(raw[group]))) {
        throw new Error(`Invalid extension group: ${group}`);
      }
      for (const [id, value] of Object.entries(raw[group] || {})) {
        if (!knownKeys.has(`${group}/${id}`) || typeof value !== "boolean") {
          throw new Error(`Invalid extension switch: ${group}.${id}`);
        }
      }
    }
    const enabled = {};
    // Newly installed packages use their declared default until a switch is added.
    for (const extension of known) {
      enabled[`${extension.group}/${extension.id}`] =
        raw[extension.group]?.[extension.id] ?? extension.defaultEnabled;
    }
    return { raw, known, enabled };
  }

  function enabledExtensions() {
    const state = readConfig();
    return state.known
      .filter(extension => state.enabled[`${extension.group}/${extension.id}`])
      .sort((left, right) => left.order - right.order || left.id.localeCompare(right.id));
  }

  function validateResourceName(value) {
    if (typeof value !== "string" ||
        !/^[a-zA-Z0-9_-]+(?:[./a-zA-Z0-9_-]*[a-zA-Z0-9_-])?$/.test(value) ||
        value.split("/").some(part => !part || part === "." || part === "..")) {
      throw new Error(`Invalid extension resource: ${value}`);
    }
  }

  function relativeFile(extension, relativeName) {
    validateResourceName(relativeName);
    const filename = path.resolve(extension.directory, relativeName);
    if (filename !== extension.directory &&
        !filename.startsWith(extension.directory + path.sep)) {
      throw new Error(`Extension asset escapes its directory: ${extension.id}`);
    }
    return filename;
  }

  function publicAsset(group, id, relativeName) {
    const extension = readManifest(group, id);
    // Server-only transforms and manifests are never exposed as browser assets.
    const publicNames = [extension.runtime, extension.style, extension.assets]
      .flatMap(value => value === undefined ? [] : Array.isArray(value) ? value : [value]);
    if (!publicNames.includes(relativeName)) return null;
    const filename = relativeFile(extension, relativeName);
    if (!fs.existsSync(filename) || !fs.statSync(filename).isFile()) return null;
    // Lexical containment is insufficient when a package contains a symlink.
    const actual = fs.realpathSync(filename);
    const actualRoot = fs.realpathSync(extension.directory);
    if (!actual.startsWith(actualRoot + path.sep)) {
      throw new Error(`Extension asset escapes its directory: ${extension.id}`);
    }
    return { extension, filename, relativeName };
  }

  function resolveAssetRequest(pathname) {
    const match = pathname.match(/^\/__extensions\/(plugins|themes)\/([a-z0-9-]+)\/(.+)$/);
    if (!match) return null;
    const [, group, id, relativeName] = match;
    const state = readConfig();
    // Disabling a package also removes access to its runtime and media assets.
    if (!state.enabled[`${group}/${id}`]) return null;
    return publicAsset(group, id, relativeName);
  }

  function runtimeTags(deployment) {
    return enabledExtensions().flatMap(extension => {
      const tags = [];
      const runtime = Array.isArray(extension.runtime)
        ? extension.runtime : extension.runtime ? [extension.runtime] : [];
      const styles = Array.isArray(extension.style)
        ? extension.style : extension.style ? [extension.style] : [];
      for (const asset of styles) {
        relativeFile(extension, asset);
        tags.push(`<link rel="stylesheet" href="${deployment.publicPath(
          `/__extensions/${extension.group}/${extension.id}/${asset}`)}">`);
      }
      for (const asset of runtime) {
        relativeFile(extension, asset);
        tags.push(`<script src="${deployment.publicPath(
          `/__extensions/${extension.group}/${extension.id}/${asset}`)}"></script>`);
      }
      return tags;
    }).join("");
  }

  function loadModule(extension, relativeName) {
    const filename = relativeFile(extension, relativeName);
    const key = `${extension.group}/${extension.id}/${relativeName}`;
    if (!moduleCache.has(key)) moduleCache.set(key, require(filename));
    return moduleCache.get(key);
  }

  function transformAsset(asset, content) {
    // Trusted installed packages may prepare their own assets (for example SVG
    // data URLs). This is not a sandbox for untrusted third-party code.
    const adapterName = asset.extension.serverAdapter;
    if (!adapterName) return content;
    const adapter = loadModule(asset.extension, adapterName);
    return typeof adapter.transformAsset === "function"
      ? adapter.transformAsset(asset.relativeName, content)
      : content;
  }

  return {
    discover,
    readConfig,
    enabledExtensions,
    resolveAssetRequest,
    runtimeTags,
    isEnabled(group, id) {
      return readConfig().enabled[`${group}/${id}`] === true;
    },
    transformAsset
  };
}

module.exports = { createExtensionLoader };
