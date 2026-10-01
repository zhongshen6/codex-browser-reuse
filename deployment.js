const fs = require("node:fs");
const path = require("node:path");

function normalizeBasePath(value = "/") {
  // Configuration must be a URL path, never an origin, query, or filesystem path.
  if (value === "/") return "/";
  if (typeof value !== "string" || !/^\/[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*\/?$/.test(value)) {
    throw new Error("basePath must be / or a path such as /codex/.");
  }
  return value.replace(/\/?$/, "/");
}

function createDeployment(value = "/") {
  const basePath = normalizeBasePath(value);
  const prefix = basePath === "/" ? "" : basePath.slice(0, -1);
  // Internal routes stay unchanged; only the HTTP deployment boundary owns the prefix.
  // Runtime adapters may receive resource literals already rewritten for this mount.
  const publicPath = internal => prefix &&
    (internal === prefix || internal.startsWith(basePath)) ? internal : prefix + internal;
  const internalPath = pathname => {
    if (basePath === "/") return pathname;
    return pathname.startsWith(basePath) ? pathname.slice(prefix.length) : null;
  };
  const rewriteResources = source => {
    if (!prefix) return source;
    // Rewrite only local resource namespaces, not CLI routes or remote API endpoints.
    return source.replace(/(["'`(])\/(__bridge|__extensions|assets|apps|images|fonts)\//g,
      (_match, delimiter, namespace) => `${delimiter}${prefix}/${namespace}/`);
  };
  return { basePath, prefix, publicPath, internalPath, rewriteResources };
}

function loadDeployment(project, env = process.env) {
  // Missing configuration means root deployment; invalid files must fail visibly.
  let config = {};
  try {
    config = JSON.parse(fs.readFileSync(path.join(project, "config", "server.json"), "utf8")
      .replace(/^\uFEFF/, ""));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  if (!config || Array.isArray(config) || typeof config !== "object" ||
      Object.keys(config).some(key => key !== "basePath")) {
    throw new Error("Invalid server.json: expected an object containing basePath.");
  }
  return createDeployment(env.CODEX_BROWSER_BASE_PATH ?? config.basePath ?? "/");
}

module.exports = { createDeployment, loadDeployment, normalizeBasePath };
