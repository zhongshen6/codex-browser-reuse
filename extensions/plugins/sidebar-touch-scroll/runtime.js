(() => {
  // Native pan-y must survive the official sidebar's touch drag sensor.
  // Mouse pointer events are deliberately left to the bundled renderer.
  window.__codexBrowserSidebarTouchPolicy?.dispose?.();
  const touchPointers = new Set();
  const sidebarSelector = "[data-app-action-sidebar-scroll]";
  const isSidebarTouch = event =>
    event.pointerType === "touch" && event.target?.closest?.(sidebarSelector);

  const onPointerDown = event => {
    if (!isSidebarTouch(event)) return;
    touchPointers.add(event.pointerId);
    // Cancelling the default here would also cancel scrolling.
    event.stopImmediatePropagation();
  };
  const onPointerMove = event => {
    if (event.pointerType !== "touch" || !touchPointers.has(event.pointerId)) return;
    event.stopImmediatePropagation();
  };
  const onPointerEnd = event => {
    if (event.pointerType === "touch") touchPointers.delete(event.pointerId);
  };

  const style = document.createElement("style");
  style.id = "codex-browser-sidebar-touch-policy";
  style.textContent = `
    ${sidebarSelector} {
      touch-action: pan-y !important;
      overscroll-behavior: contain !important;
    }
    ${sidebarSelector} .touch-none {
      touch-action: pan-y !important;
    }
    ${sidebarSelector} [data-app-action-sidebar-thread-row] {
      touch-action: pan-y !important;
      -webkit-user-drag: none !important;
    }
  `;
  document.head.appendChild(style);
  window.addEventListener("pointerdown", onPointerDown, true);
  window.addEventListener("pointermove", onPointerMove, true);
  window.addEventListener("pointerup", onPointerEnd, true);
  window.addEventListener("pointercancel", onPointerEnd, true);

  window.__codexBrowserSidebarTouchPolicy = {
    dispose() {
      window.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("pointermove", onPointerMove, true);
      window.removeEventListener("pointerup", onPointerEnd, true);
      window.removeEventListener("pointercancel", onPointerEnd, true);
      touchPointers.clear();
      style.remove();
      delete window.__codexBrowserSidebarTouchPolicy;
    }
  };
})();
