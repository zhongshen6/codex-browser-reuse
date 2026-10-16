/*
 * Frontend-only scheduled-task policy.
 *
 * The source adapter removes the official UI and query observers before they
 * mount. This small runtime guard is a second boundary for old or newly
 * loaded renderer code; it does not alter CLI tools or model-visible tools.
 */
(() => {
  // Reinstalling the runtime guard must not stack wrappers. Changing the
  // persisted switch still requires a page refresh to rebuild query observers.
  window.__codexBrowserDisableAutomationsRuntime?.dispose();
  window.__codexBrowserDisableAutomations = true;

  const previous = window.__codexBrowserExtensionPolicy;
  const blockedPath = /(?:^|\/)(?:automations?|inbox)(?:[-/]|$)|(?:^|\/)(?:list-automations|create-automation)(?:\/|$)/i;
  const blockedMessage = /^(?:automation|automations|inbox|heartbeat-automation)(?:[-/]|$)/i;
  const runtime = { blockedCount: 0 };
  const disabled = () => {
    runtime.blockedCount += 1;
    return { blocked: true, reason: "automations-disabled" };
  };
  const isBlockedUrl = value => {
    // Match the API pathname, not query text or attached file paths. Normal
    // downloads mentioning automation files must continue to work.
    try {
      const pathname = new URL(String(value), location.href).pathname;
      if (/\/(?:assets|__extensions|images|fonts)\//.test(pathname)) return false;
      return blockedPath.test(pathname);
    } catch {
      return false;
    }
  };

  const policy = {
    ...previous,
    beforeFetchRequest(target) {
      const inherited = previous?.beforeFetchRequest?.(target);
      if (inherited?.blocked) return inherited;
      return isBlockedUrl(target.href) ? disabled() : null;
    },
    beforeBridgeMessage(message) {
      const inherited = previous?.beforeBridgeMessage?.(message);
      if (inherited?.blocked) return inherited;

      if (message?.type === "fetch" && isBlockedUrl(message.url)) {
        return disabled();
      }
      if (message?.type === "worker-request" &&
          blockedMessage.test(String(message.request?.method || ""))) {
        return disabled();
      }
      if (blockedMessage.test(String(message?.type || ""))) return disabled();
      // RPC tool catalogs and model calls are deliberately not filtered here.
      return null;
    }
  };
  window.__codexBrowserExtensionPolicy = policy;

  window.__codexBrowserDisableAutomationsRuntime = {
    snapshot: () => ({ blockedCount: runtime.blockedCount }),
    dispose() {
      if (window.__codexBrowserExtensionPolicy === policy) {
        window.__codexBrowserExtensionPolicy = previous;
      }
      delete window.__codexBrowserDisableAutomations;
      delete window.__codexBrowserDisableAutomationsRuntime;
    }
  };
})();
