(() => {
  function createRightPanelPolicy() {
    const scopes = new WeakMap();
    return ({ scope, isOpen, isFullWidth, allowFullWidth, workspaceWidth, setFullWidth }) => {
      let state = scopes.get(scope);
      if (!state) {
        state = { handled: false, automatic: false };
        scopes.set(scope, state);
      }
      if (!isOpen) {
        // Retain ownership until reopen: the official renderer may remember
        // the full-width state of a closed panel.
        state.handled = false;
        return;
      }
      const width = Number(workspaceWidth);
      if (!Number.isFinite(width) || width <= 0) return;
      if (state.automatic && !isFullWidth) {
        // A manual restore wins for the rest of this panel-open session.
        state.automatic = false;
        state.handled = true;
      }
      if (width >= 768) {
        if (state.automatic && isFullWidth) {
          state.automatic = false;
          state.handled = false;
          setFullWidth(false);
          return "restore";
        }
        return;
      }
      if (state.handled || isFullWidth || allowFullWidth === false) return;
      // Mark before dispatch so a synchronous renderer update cannot repeat it.
      state.handled = true;
      state.automatic = true;
      setFullWidth(true);
      return "expand";
    };
  }

  // The renderer calls this policy with its own scope and official action.
  // It does not query private React objects, poll the DOM, or fabricate clicks.
  if (typeof module === "object" && module.exports) {
    module.exports = { createRightPanelPolicy };
  } else {
    window.__codexBrowserRightPanelPolicy = createRightPanelPolicy();
  }
})();
