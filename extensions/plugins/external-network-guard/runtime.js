(() => {
  // The browser frontend must use the bridge for model and host traffic.
  // Same-origin extension assets and local data/blob URLs remain available.
  window.__codexBrowserExternalNetworkGuard?.dispose?.();
  const previous = window.__codexBrowserExtensionPolicy;
  const originalFetch = window.fetch;
  const originalXHR = window.XMLHttpRequest;
  const originalConstructors = new Map();
  const guardedConstructors = new Map();
  const originalSendBeacon = typeof navigator !== "undefined"
    ? navigator.sendBeacon : undefined;
  const serviceWorkerContainer = typeof navigator !== "undefined"
    ? navigator.serviceWorker : undefined;
  const originalServiceWorkerRegister = serviceWorkerContainer?.register;
  let guardedFetch = null;
  let guardedXHR = null;
  let guardedSendBeacon = null;
  let guardedServiceWorkerRegister = null;
  const runtime = { blockedCount: 0, origins: new Map(), channels: new Map() };
  const localProtocols = new Set(["data:", "blob:"]);

  const targetUrl = value => {
    try {
      return new URL(String(value || ""), location.href);
    } catch {
      return null;
    }
  };
  const localSocket = target => {
    if (!target || !["ws:", "wss:"].includes(target.protocol)) return false;
    const locationPort = location.port ||
      (location.protocol === "https:" ? "443" : "80");
    const targetPort = target.port || (target.protocol === "wss:" ? "443" : "80");
    return target.hostname === location.hostname && targetPort === locationPort;
  };
  const isAllowed = target => target &&
    (target.origin === location.origin ||
      localProtocols.has(String(target.protocol || "")) ||
      localSocket(target));
  const report = (target, channel) => {
    runtime.blockedCount += 1;
    const origin = String(target?.origin || "unknown");
    runtime.origins.set(origin, (runtime.origins.get(origin) || 0) + 1);
    runtime.channels.set(channel, (runtime.channels.get(channel) || 0) + 1);
    // The bridge records the event without copying the path or request body.
    try {
      window.dispatchEvent(new CustomEvent("codex-external-network-blocked", {
        detail: { origin, channel }
      }));
    } catch {}
  };
  const blocked = (target, channel = "fetch") => {
    report(target, channel);
    return {
      blocked: true,
      reason: "external-fetch-disabled",
      fields: [String(target?.origin || "unknown"), channel]
    };
  };

  const policy = {
    ...previous,
    beforeFetchRequest(target) {
      const inherited = previous?.beforeFetchRequest?.(target);
      if (inherited?.blocked) return inherited;
      if (target?.origin === location.origin ||
          localProtocols.has(String(target?.protocol || ""))) {
        return null;
      }
      return blocked(target, "fetch-policy");
    }
  };
  window.__codexBrowserExtensionPolicy = policy;

  const rejectedResponse = () => typeof Response === "function"
    ? new Response(JSON.stringify({
      error: "该前端功能已由扩展禁用", code: "FRONTEND_EXTENSION_DISABLED"
    }), { status: 410, headers: { "content-type": "application/json" } })
    : null;
  const nativeFetch = typeof originalFetch === "function" ? originalFetch.bind(window) : null;
  if (nativeFetch) {
    // Cover the short interval before bridge.js installs its CSRF-aware fetch.
    guardedFetch = (input, options = {}) => {
      const requestUrl = typeof Request !== "undefined" && input instanceof Request
        ? input.url : input;
      const target = targetUrl(requestUrl);
      if (target && !isAllowed(target)) {
        const result = blocked(target, "fetch");
        return Promise.resolve(rejectedResponse() || result);
      }
      return nativeFetch(input, options);
    };
    window.fetch = guardedFetch;
  }

  const NativeXHR = originalXHR;
  if (typeof NativeXHR === "function") {
    // Preserve the native prototype so same-origin callers keep normal XHR
    // identity and event behavior.
    guardedXHR = function (...args) {
      const xhr = new NativeXHR(...args);
      const nativeOpen = xhr.open;
      xhr.open = function (method, url, ...rest) {
        const target = targetUrl(url);
        if (target && !isAllowed(target)) {
          blocked(target, "xhr");
          throw new TypeError("External network access is disabled");
        }
        return nativeOpen.call(xhr, method, url, ...rest);
      };
      return xhr;
    };
    guardedXHR.prototype = NativeXHR.prototype;
    Object.setPrototypeOf(guardedXHR, NativeXHR);
    window.XMLHttpRequest = guardedXHR;
  }

  const wrapSocketConstructor = (name, channel) => {
    const NativeConstructor = window[name];
    if (typeof NativeConstructor !== "function") return;
    originalConstructors.set(name, NativeConstructor);
    const guarded = new Proxy(NativeConstructor, {
      construct(target, args, newTarget) {
        const targetValue = targetUrl(args[0]);
        if (targetValue && !isAllowed(targetValue)) {
          blocked(targetValue, channel);
          throw new TypeError("External network access is disabled");
        }
        return Reflect.construct(target, args, newTarget);
      }
    });
    guardedConstructors.set(name, guarded);
    window[name] = guarded;
  };
  wrapSocketConstructor("WebSocket", "websocket");
  wrapSocketConstructor("EventSource", "eventsource");

  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    const nativeSendBeacon = navigator.sendBeacon.bind(navigator);
    try {
      guardedSendBeacon = (url, data) => {
        const target = targetUrl(url);
        if (target && !isAllowed(target)) {
          blocked(target, "send-beacon");
          return false;
        }
        return nativeSendBeacon(url, data);
      };
      navigator.sendBeacon = guardedSendBeacon;
    } catch {}
  }

  if (serviceWorkerContainer && typeof originalServiceWorkerRegister === "function") {
    // A Service Worker has its own global fetch and could bypass the page
    // bridge. Notifications are backend-owned here, so no worker is needed.
    try {
      guardedServiceWorkerRegister = (...args) => {
        const target = targetUrl(args[0]);
        report(target, "service-worker-register");
        return Promise.reject(new TypeError("Service Worker is disabled"));
      };
      serviceWorkerContainer.register = guardedServiceWorkerRegister;
    } catch {}
  }

  // CSP covers declarative requests and external scripts that cannot pass
  // through the JavaScript wrappers above.
  const securityPolicyViolation = event => {
    const target = targetUrl(event.blockedURI);
    if (!target || isAllowed(target)) return;
    report(target, `csp:${event.effectiveDirective || "unknown"}`);
  };
  window.addEventListener?.("securitypolicyviolation", securityPolicyViolation);

  window.__codexBrowserExternalNetworkGuard = {
    snapshot() {
      return {
        blockedCount: runtime.blockedCount,
        origins: Object.fromEntries(runtime.origins),
        channels: Object.fromEntries(runtime.channels)
      };
    },
    dispose() {
      if (window.__codexBrowserExtensionPolicy === policy) {
        window.__codexBrowserExtensionPolicy = previous;
      }
      if (guardedFetch && window.fetch === guardedFetch) window.fetch = originalFetch;
      if (guardedXHR && window.XMLHttpRequest === guardedXHR) {
        window.XMLHttpRequest = originalXHR;
      }
      for (const [name, guarded] of guardedConstructors) {
        if (window[name] === guarded) window[name] = originalConstructors.get(name);
      }
      if (guardedSendBeacon && typeof navigator !== "undefined" &&
          navigator.sendBeacon === guardedSendBeacon) {
        navigator.sendBeacon = originalSendBeacon;
      }
      if (guardedServiceWorkerRegister && serviceWorkerContainer &&
          serviceWorkerContainer.register === guardedServiceWorkerRegister) {
        serviceWorkerContainer.register = originalServiceWorkerRegister;
      }
      window.removeEventListener?.("securitypolicyviolation", securityPolicyViolation);
      delete window.__codexBrowserExternalNetworkGuard;
    }
  };
})();
