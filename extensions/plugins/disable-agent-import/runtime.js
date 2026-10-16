/*
 * Frontend-only policy for excluded external-agent imports.
 * Query sources are disabled by the core adapter; this guard catches escapes.
 * CLI configuration and model-visible tool catalogs remain unchanged.
 */
(() => {
  window.__codexBrowserDisableAgentImportRuntime?.dispose();
  window.__codexBrowserDisableAgentImport = true;
  const previous = window.__codexBrowserExtensionPolicy;
  const state = { blockedCount: 0 };
  function blockedUrl(value) {
    try {
      const pathname = new URL(String(value), location.href).pathname;
      return /^\/external-agent-import(?:-|\/|$)/.test(pathname);
    } catch { return false; }
  }
  function disabled() {
    state.blockedCount += 1;
    return { blocked: true, reason: "agent-import-disabled" };
  }
  const policy = {
    ...previous,
    beforeFetchRequest(target) {
      const inherited = previous?.beforeFetchRequest?.(target);
      return inherited?.blocked ? inherited : blockedUrl(target.href) ? disabled() : null;
    },
    beforeBridgeMessage(message) {
      const inherited = previous?.beforeBridgeMessage?.(message);
      if (inherited?.blocked) return inherited;
      return message?.type === "fetch" && blockedUrl(message.url) ? disabled() : null;
    }
  };
  window.__codexBrowserExtensionPolicy = policy;
  window.__codexBrowserDisableAgentImportRuntime = {
    snapshot: () => ({ ...state }),
    dispose() {
      // Only undo our own policy when it is still the outermost installed guard.
      if (window.__codexBrowserExtensionPolicy === policy) window.__codexBrowserExtensionPolicy = previous;
      delete window.__codexBrowserDisableAgentImport;
      delete window.__codexBrowserDisableAgentImportRuntime;
    }
  };
})();
