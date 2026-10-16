/*
 * Codex++ sidebar performance optimizer.
 * Independent from touch scrolling and visual themes.
 */
(async () => {
  window.__codexPerformanceRuntime?.dispose?.();
  window.__codexSidebarLayoutRuntime?.dispose?.();

  const styleId = 'codex-performance-optimizer-style';
  document.getElementById(styleId)?.remove();

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    aside.app-shell-left-panel :is([data-app-action-sidebar-scroll], .vertical-scroll-fade-mask),
    aside.app-shell-left-panel :is([data-app-action-sidebar-scroll], .vertical-scroll-fade-mask) * {
      transition-property: none !important;
    }

    /*
     * The official sidebar can keep CSS animations alive while a long list is
     * moving. Pause every sidebar animation during the gesture so animation
     * sampling and paint invalidation do not compete with scroll updates.
     */
    html[data-codex-performance-scrolling="true"] aside.app-shell-left-panel,
    html[data-codex-performance-scrolling="true"] aside.app-shell-left-panel * {
      animation: none !important;
    }

    /* Avoid recompositing a full-height filtered surface during sidebar movement. */
    html[data-codex-performance-scrolling="true"] aside.app-shell-left-panel,
    html[data-codex-performance-scrolling="true"] aside.app-shell-left-panel::before,
    html[data-codex-performance-scrolling="true"] aside.app-shell-left-panel::after {
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
      filter: none !important;
      box-shadow: none !important;
    }

    /*
     * Row containment is useful during a real scroll, but it changes the
     * official layout tree during sidebar open and close. Keep it scoped to
     * the scroll state so the toggle path retains the original structure.
     */
    html[data-codex-performance-scrolling="true"] aside.app-shell-left-panel :is([data-app-action-sidebar-thread-row], [data-app-action-sidebar-project-row], .sidebar-item) {
      contain: layout paint style;
    }
  `;
  // Init scripts can run before the parser has created <head>. Defer only
  // stylesheet insertion; the ResizeObserver wrapper below must install now.
  const appendStyle = () => {
    if (document.head) {
      document.head.append(style);
      return;
    }
    document.addEventListener('DOMContentLoaded', appendStyle, { once: true });
  };
  appendStyle();

  /*
   * thread-scroll-layout observes the main layout, content surface, and
   * header together. During a sidebar width transition those three elements
   * resize on every animation frame, so its overlap check repeatedly forces
   * synchronous geometry reads. Hold only that observer during the short
   * transition and flush its last entries once the final width is stable.
   */
  const originalResizeObserver = window.ResizeObserver;
  const controlledObservers = new Set();
  const layoutState = {
    active: false,
    suppressedCallbacks: 0,
    releaseTimer: 0,
  };
  const matchesRole = (element, role) => {
    if (!(element instanceof Element)) return false;
    if (role === 'main') {
      return element.matches('[data-app-shell-main-content-layout]');
    }
    if (role === 'header') {
      return element.matches('header[data-app-shell-header-layout]');
    }
    if (role === 'navigation-content') {
      return element.matches(
        '[data-thread-user-message-navigation-content]'
      );
    }
    return [...element.classList].some(className =>
      className.includes('Probe')
    );
  };
  const isThreadScrollObserver = observer =>
    observer.roles.has('main') &&
    observer.roles.has('header') &&
    observer.roles.has('probe');
  const isNavigationRailObserver = observer =>
    observer.roles.has('navigation-content');

  const flushObservers = () => {
    layoutState.active = false;
    document.documentElement.removeAttribute('data-codex-sidebar-transition');
    for (const observer of controlledObservers) {
      if (!observer.pendingEntries.length) continue;
      const entries = observer.pendingEntries;
      observer.pendingEntries = [];
      observer.callback(entries, observer.instance);
    }
  };

  const beginSidebarTransition = () => {
    layoutState.active = true;
    document.documentElement.dataset.codexSidebarTransition = 'true';
    if (layoutState.releaseTimer) {
      window.clearTimeout(layoutState.releaseTimer);
    }
    layoutState.releaseTimer = window.setTimeout(flushObservers, 700);
  };

  window.ResizeObserver = class CodexPerformanceResizeObserver {
    constructor(callback) {
      const record = {
        callback,
        instance: null,
        roles: new Set(),
        pendingEntries: [],
        disposed: false,
      };
      const instance = new originalResizeObserver((entries) => {
        if (
          (!isThreadScrollObserver(record) &&
            !isNavigationRailObserver(record)) ||
          !layoutState.active
        ) {
          callback(entries, instance);
          return;
        }
        record.pendingEntries = entries;
        layoutState.suppressedCallbacks += 1;
      });
      record.instance = instance;
      this.__codexPerformanceRecord = record;
      instance.__codexPerformanceRecord = record;
      controlledObservers.add(record);
    }

    observe(element, options) {
      const record = this.__codexPerformanceRecord;
      for (const role of [
        'main',
        'header',
        'probe',
        'navigation-content',
      ]) {
        if (matchesRole(element, role)) record.roles.add(role);
      }
      return record.instance.observe(element, options);
    }

    unobserve(element) {
      return this.__codexPerformanceRecord.instance.unobserve(element);
    }

    disconnect() {
      const record = this.__codexPerformanceRecord;
      record.disposed = true;
      controlledObservers.delete(record);
      return record.instance.disconnect();
    }
  };

  const onSidebarClick = (event) => {
    if (event.target?.closest?.('[data-app-shell-sidebar-trigger="true"]')) {
      beginSidebarTransition();
    }
  };
  document.addEventListener('click', onSidebarClick, true);

  const onSidebarStateMutation = (mutations) => {
    if (mutations.some(mutation => mutation.attributeName === 'aria-expanded')) {
      beginSidebarTransition();
    }
  };
  let sidebarStateObserver = null;
  const attachSidebarStateObserver = () => {
    if (!document.documentElement) {
      document.addEventListener(
        'DOMContentLoaded',
        attachSidebarStateObserver,
        { once: true }
      );
      return;
    }
    sidebarStateObserver = new MutationObserver(onSidebarStateMutation);
    sidebarStateObserver.observe(document.documentElement, {
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-expanded'],
    });
  };
  attachSidebarStateObserver();

  window.__codexSidebarLayoutRuntime = {
    dispose() {
      if (layoutState.releaseTimer) {
        window.clearTimeout(layoutState.releaseTimer);
      }
      flushObservers();
      document.removeEventListener('click', onSidebarClick, true);
      sidebarStateObserver?.disconnect();
      window.ResizeObserver = originalResizeObserver;
      controlledObservers.clear();
      delete window.__codexSidebarLayoutRuntime;
    },
    snapshot() {
      return {
        active: layoutState.active,
        suppressedCallbacks: layoutState.suppressedCallbacks,
        controlledObservers: controlledObservers.size,
      };
    },
  };

  const selectors = [
    '[data-app-action-sidebar-scroll]',
    'aside.app-shell-left-panel .vertical-scroll-fade-mask'
  ];
  const isSidebarScroller = (target) => {
    if (!(target instanceof Element)) return false;
    return selectors.some((selector) => target.matches(selector));
  };

  let releaseTimer = 0;
  let scrollEvents = 0;
  let activeSince = 0;
  let lastScrollAt = 0;
  let lastScroller = null;

  const release = () => {
    releaseTimer = 0;
    document.documentElement.removeAttribute('data-codex-performance-scrolling');
  };

  const onScroll = (event) => {
    if (!isSidebarScroller(event.target)) return;
    const now = performance.now();
    lastScroller = event.target;
    if (!activeSince) activeSince = now;
    lastScrollAt = now;
    scrollEvents += 1;
    document.documentElement.dataset.codexPerformanceScrolling = 'true';
    if (releaseTimer) window.clearTimeout(releaseTimer);
    releaseTimer = window.setTimeout(release, 140);
  };

  document.addEventListener('scroll', onScroll, { capture: true, passive: true });

  window.__codexPerformanceRuntime = {
    snapshot() {
      const scroller = lastScroller || document.querySelector(selectors.join(','));
      return {
        enabled: true,
        scrolling: document.documentElement.dataset.codexPerformanceScrolling === 'true',
        scrollEvents,
        activeForMs: activeSince ? Math.round(performance.now() - activeSince) : 0,
        sinceLastScrollMs: lastScrollAt ? Math.round(performance.now() - lastScrollAt) : null,
        scroller: scroller ? {
          scrollTop: Math.round(scroller.scrollTop),
          scrollHeight: Math.round(scroller.scrollHeight),
          clientHeight: Math.round(scroller.clientHeight)
        } : null
      };
    },
    dispose() {
      if (releaseTimer) window.clearTimeout(releaseTimer);
      document.removeEventListener('scroll', onScroll, true);
      document.documentElement.removeAttribute('data-codex-performance-scrolling');
      document.getElementById(styleId)?.remove();
      window.__codexSidebarLayoutRuntime?.dispose?.();
      delete window.__codexPerformanceRuntime;
    }
  };

  return window.__codexPerformanceRuntime.snapshot();
})();
