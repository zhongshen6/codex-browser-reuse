const path = require("node:path");
const { adaptCoreRenderer } = require("./core-extension-adapters");

const FRONTEND_ROOT = "runtime/codex-frontend-26.917.9434/webview";
// Limit precompression to large startup assets, rather than every fetched file.
const BUILD_ASSETS = [
  "app-initial-fc9a33fdda88.js", "app-shared-dc8f183e4945.js",
  "app-primary-a7ff54c980af.js", "app-shared-fa570b9eb9dd.css",
  "app-initial-e8ceb32eb626.css", "app-primary-484df789f2f5.css",
  "zh-CN-6b83584f4688.js"
];
// These modules determine served bytes; changes invalidate prepared output.
const BUILD_INPUTS = [
  "src/frontend-assets.js", "src/core-extension-adapters.js",
  "src/renderer-panel-adapter.js", "src/renderer-file-adapter.js",
  "src/renderer-attachment-adapter.js", "src/renderer-automation-adapter.js",
  "src/renderer-agent-import-adapter.js", "src/deployment.js",
  "tools/build-frontend.js"
];
const CORE_SWITCHES = [
  "disable-automations", "disable-agent-import", "right-panel",
  "file-previews", "browser-attachments"
];

// Take one configuration snapshot so all private adapters use the same switches.
// The build manifest records only switches that affect generated bundle bytes.
function buildContext(deployment, loader) {
  const { enabled } = loader.readConfig();
  // Runtime-only themes/plugins do not change these official bundle bytes.
  return {
    basePath: deployment.basePath,
    enabled: Object.fromEntries(CORE_SWITCHES.map(id => [id, enabled[`plugins/${id}`] === true]))
  };
}

function adaptBrowserRouter(source) {
  // Fail visibly after an official bundle update instead of losing navigation.
  const original = "a.current??=Q3e({initialEntries:n,initialIndex:r,v5Compat:!0});let o=a.current,[s,c]=Sd.useState({action:o.action,location:o.location}),l=Sd.useCallback(e=>{i===!1?c(e):Sd.startTransition(()=>c(e))},[i]);return Sd.useLayoutEffect(()=>o.listen(l),[o,l]),Sd.createElement(Q6e";
  const adapted = "a.current??=Q3e({initialEntries:window.__codexBrowserInitialRoute?[window.__codexBrowserInitialRoute]:n,initialIndex:r,v5Compat:!0});let o=a.current,[s,c]=Sd.useState({action:o.action,location:o.location}),l=Sd.useCallback(e=>{window.__codexBrowserRouteChanged?.(e.location,e.action);i===!1?c(e):Sd.startTransition(()=>c(e))},[i]);return Sd.useLayoutEffect(()=>{window.__codexBrowserNavigate=path=>o.replace(path);return()=>{delete window.__codexBrowserNavigate}},[o]),Sd.useLayoutEffect(()=>o.listen(l),[o,l]),Sd.createElement(Q6e";
  if (source.split(original).length !== 2) {
    throw new Error("Packaged memory router signature changed");
  }
  return source.replace(original, adapted);
}

function transformFrontend(filename, source, deployment, context) {
  const name = path.basename(filename);
  // Use the same adapters for manual builds and the plain-response fallback.
  const loader = { isEnabled: (group, id) => group === "plugins" && context.enabled[id] === true };
  if (name === BUILD_ASSETS[0]) source = adaptCoreRenderer(loader, "initial", adaptBrowserRouter(source));
  if (name === BUILD_ASSETS[2]) source = adaptCoreRenderer(loader, "primary", source);
  return deployment.rewriteResources(source);
}

module.exports = { FRONTEND_ROOT, BUILD_ASSETS, BUILD_INPUTS, buildContext, transformFrontend };
