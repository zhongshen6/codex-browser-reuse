(() => {
  const basePath = window.__codexBrowserBasePath || "/";
  const prefix = basePath === "/" ? "" : basePath.slice(0, -1);
  // Renderer routes remain root-relative; the address bar includes the deployment prefix.
  // Server-rewritten literals already contain the mount; never add it twice.
  const publicPath = value => prefix &&
    (value === prefix || value.startsWith(basePath)) ? value : prefix + value;
  const internalPath = value => {
    if (!prefix) return value;
    return value.startsWith(basePath) ? value.slice(prefix.length) : "/";
  };
  window.__codexBrowserPaths = { basePath, publicPath, internalPath };
  window.__codexBrowserInitialRoute =
    internalPath(location.pathname) + location.search + location.hash;
})();
