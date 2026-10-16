(() => {
  const heightProperty = "--codex-browser-viewport-height";

  function measureViewport(win) {
    const visual = win.visualViewport;
    const layoutHeight = Number(win.innerHeight);
    const visualHeight = Number(visual?.height);
    const scale = Number(visual?.scale ?? 1);
    // Pinch zoom changes the visual viewport without changing layout. Resizing
    // the app in that state would fight the user's zoom and move the controls.
    const pinched = Number.isFinite(scale) && Math.abs(scale - 1) > 0.02;
    const height = !pinched && Number.isFinite(visualHeight) && visualHeight > 0
      ? Math.min(layoutHeight, visualHeight)
      : layoutHeight;
    // A landscape phone can be wider than the desktop sidebar breakpoint.
    const compactDevice = Number(win.innerWidth) <= 767 ||
      win.matchMedia?.("(pointer: coarse)")?.matches === true;
    return {
      height: Number.isFinite(height) && height > 0 ? height : null,
      pinched,
      compact: compactDevice && height <= 480,
      veryShort: compactDevice && height <= 320
    };
  }

  function installViewport(win, doc) {
    win.__codexBrowserViewport?.dispose();
    const root = doc.documentElement;
    let frame = null;
    let previous = {};
    const update = () => {
      frame = null;
      const next = measureViewport(win);
      const value = next.pinched || next.height === null ? null : `${next.height}px`;
      if (previous.value !== value) {
        // dvh remains the CSS fallback during pinch zoom or invalid measurements.
        if (value === null) root.style.removeProperty(heightProperty);
        else root.style.setProperty(heightProperty, value);
      }
      for (const [key, attribute] of [
        ["compact", "data-browser-compact-height"],
        ["veryShort", "data-browser-very-short-height"]
      ]) {
        if (previous[key] !== next[key]) root.toggleAttribute(attribute, next[key]);
      }
      previous = { ...next, value };
    };
    const schedule = () => {
      // Mobile toolbars and keyboards emit bursts of resize/scroll events.
      // One update per frame keeps the layout write bounded and avoids polling.
      if (frame === null) frame = win.requestAnimationFrame(update);
    };
    const listeners = [
      [win, "resize"], [win, "pageshow"],
      [win.visualViewport, "resize"], [win.visualViewport, "scroll"]
    ].filter(([target]) => target);
    for (const [target, event] of listeners) target.addEventListener(event, schedule, { passive: true });
    update();
    const controller = {
      getState: () => ({ ...previous }),
      dispose() {
        if (frame !== null) win.cancelAnimationFrame(frame);
        for (const [target, event] of listeners) target.removeEventListener(event, schedule);
        root.style.removeProperty(heightProperty);
        root.removeAttribute("data-browser-compact-height");
        root.removeAttribute("data-browser-very-short-height");
        if (win.__codexBrowserViewport === controller) delete win.__codexBrowserViewport;
      }
    };
    win.__codexBrowserViewport = controller;
    return controller;
  }

  // Export the same measurement and lifecycle logic for isolated Node tests.
  // In the served browser script, install before the renderer mounts its shell.
  if (typeof module === "object" && module.exports) {
    module.exports = { measureViewport, installViewport };
  } else {
    installViewport(window, document);
  }
})();
