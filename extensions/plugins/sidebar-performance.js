/*
 * Codex++ sidebar performance optimizer.
 * Independent from touch scrolling and visual themes.
 */
(async () => {
  window.__codexPerformanceRuntime?.dispose?.();

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

    /* Isolate individual rows so a paint invalidation cannot escape into the whole list. */
    aside.app-shell-left-panel :is([data-app-action-sidebar-thread-row], [data-app-action-sidebar-project-row], .sidebar-item) {
      contain: layout paint style;
    }
  `;
  document.head.append(style);

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
      delete window.__codexPerformanceRuntime;
    }
  };

  return window.__codexPerformanceRuntime.snapshot();
})();
