(() => {
  const labels = {
    restart: "\u91cd\u542f\u540e\u7aef",
    stop: "\u505c\u6b62\u540e\u7aef",
    cancel: "\u53d6\u6d88",
    close: "\u5173\u95ed"
  };
  const icons = { restart: "refresh-ccw-5fc35ace821e.svg", stop: "power-c96d66432eea.svg" };

  function createControlClient(win, { pause = ms => new Promise(resolve => win.setTimeout(resolve, ms)) } = {}) {
    // Mount-aware URLs work both locally and through the configured deployment prefix.
    const endpoint = action => `${win.__codexBrowserBasePath || "/"}__bridge/backend/${action}`;
    // Send CSRF explicitly because extension runtimes load before the bridge wrapper.
    const headers = () => ({
      "content-type": "application/json", "x-codex-backend-control": "1",
      ...(win.__codexBrowserCsrfToken ? { "x-codex-csrf": win.__codexBrowserCsrfToken } : {})
    });
    return {
      async submit(action) {
        // The only commands accepted here and by the server are these fixed actions.
        if (!["restart", "stop"].includes(action)) throw new Error("\u65e0\u6548\u7684\u540e\u7aef\u64cd\u4f5c");
        const response = await win.fetch(endpoint(action), {
          method: "POST", headers: headers(), body: "{}", cache: "no-store",
          signal: win.AbortSignal?.timeout(10000)
        });
        // Do not display restart progress when the server rejected the operation.
        if (response.status !== 202) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error === "BACKEND_CONTROL_PENDING"
            ? "\u540e\u7aef\u6b63\u5728\u6267\u884c\u53e6\u4e00\u4e2a\u542f\u505c\u64cd\u4f5c"
            : "\u64cd\u4f5c\u672a\u80fd\u6267\u884c\uff0c\u8bf7\u68c0\u67e5\u540e\u7aef\u72b6\u6001\u548c\u767b\u5f55\u72b6\u6001");
        }
        return response.json();
      },
      async waitForRestart(instanceId, active = () => true) {
        // A responding old instance is not proof that the restart has completed.
        // Bound retries even when individual probes take longer than their interval.
        const started = Date.now();
        for (let attempt = 0; attempt < 120 && active() && Date.now() - started < 90000; attempt++) {
          await pause(750);
          if (!active()) return false;
          try {
            // Bound each probe as well as the overall wait on unreliable LAN connections.
            const response = await win.fetch(endpoint("status"), {
              cache: "no-store", signal: win.AbortSignal?.timeout(3000)
            });
            // LAN sessions intentionally expire across backend restarts; reload to log in.
            if (response.status === 401) return true;
            if (!response.ok) continue;
            const status = await response.json();
            if (status.instanceId !== instanceId && status.ready) return true;
          } catch {
            // The brief connection failure between instances is expected.
          }
        }
        if (!active()) return false;
        throw new Error("\u540e\u7aef\u672a\u5728\u9884\u671f\u65f6\u95f4\u5185\u6062\u590d\uff0c\u8bf7\u68c0\u67e5\u540e\u7aef\u65e5\u5fd7");
      }
    };
  }

  function installSettingsControls(win, doc) {
    win.__codexBrowserBackendControls?.dispose();
    const client = createControlClient(win);
    const iconCache = new Map();
    // Track only plugin-owned nodes so cleanup never removes official navigation.
    const owned = new Set();
    let frame = null;
    let busy = false;
    let disposed = false;
    let modal = null;

    async function loadIcon(action) {
      if (!iconCache.has(action)) {
        // Reuse the packaged Lucide SVGs rather than introducing a separate icon system.
        const url = `${win.__codexBrowserBasePath || "/"}assets/${icons[action]}`;
        iconCache.set(action, win.fetch(url).then(response => {
          if (!response.ok) throw new Error("Icon unavailable");
          return response.text();
        }).then(text => new win.DOMParser().parseFromString(text, "image/svg+xml").querySelector("svg"))
          .catch(() => null));
      }
      return iconCache.get(action);
    }

    function setBusy(value) {
      busy = value;
      for (const element of owned) element.disabled = value;
    }

    function openDialog(action) {
      if (busy || disposed) return;
      modal?.remove();
      const dialog = doc.createElement("dialog");
      dialog.className = "browser-backend-dialog";
      dialog.setAttribute("aria-labelledby", "backend-dialog-title");
      dialog.setAttribute("aria-describedby", "backend-dialog-description");
      const title = doc.createElement("h2");
      title.id = "backend-dialog-title";
      title.textContent = labels[action];
      const description = doc.createElement("p");
      description.id = "backend-dialog-description";
      // Both operations affect all clients, so task interruption is explicit before submission.
      description.textContent = action === "restart"
        ? "\u91cd\u542f\u4f1a\u65ad\u5f00\u6240\u6709\u8bbe\u5907\u7684\u8fde\u63a5\uff0c\u5e76\u53ef\u80fd\u4e2d\u65ad\u6b63\u5728\u8fd0\u884c\u7684\u4efb\u52a1\u3002\u6062\u590d\u540e\u5c06\u81ea\u52a8\u5237\u65b0\u5f53\u524d\u9875\u9762\u3002"
        : "\u505c\u6b62\u4f1a\u65ad\u5f00\u6240\u6709\u8bbe\u5907\u7684\u8fde\u63a5\uff0c\u5e76\u53ef\u80fd\u4e2d\u65ad\u6b63\u5728\u8fd0\u884c\u7684\u4efb\u52a1\u3002\u9700\u8981\u5728\u540e\u7aef\u7535\u8111\u4e0a\u91cd\u65b0\u542f\u52a8\u624d\u80fd\u7ee7\u7eed\u4f7f\u7528\u3002";
      const status = doc.createElement("p");
      status.setAttribute("role", "status");
      const actions = doc.createElement("div");
      actions.className = "backend-dialog-actions";
      const cancel = doc.createElement("button");
      cancel.type = "button";
      cancel.textContent = labels.cancel;
      cancel.addEventListener("click", () => dialog.close());
      const confirm = doc.createElement("button");
      confirm.type = "button";
      confirm.dataset.confirm = "";
      confirm.textContent = labels[action];
      confirm.addEventListener("click", async () => {
        // Repeated touches and clicks must not issue competing service operations.
        if (busy) return;
        setBusy(true);
        cancel.disabled = confirm.disabled = true;
        status.textContent = "\u6b63\u5728\u63d0\u4ea4\u64cd\u4f5c";
        try {
          const accepted = await client.submit(action);
          if (disposed) return;
          if (action === "restart") {
            status.textContent = "\u6b63\u5728\u91cd\u542f\uff0c\u7b49\u5f85\u540e\u7aef\u6062\u590d";
            // Retain the current deep link; a full reload also restores the fresh session bootstrap.
            if (await client.waitForRestart(accepted.instanceId, () => !disposed)) win.location.reload();
          } else {
            // Acknowledgment is not completion; avoid claiming a stopped process prematurely.
            status.textContent = "\u505c\u6b62\u8bf7\u6c42\u5df2\u63a5\u53d7\uff0c\u9875\u9762\u5373\u5c06\u65ad\u5f00\u8fde\u63a5";
            cancel.textContent = labels.close;
            cancel.disabled = false;
            confirm.hidden = true;
          }
        } catch (error) {
          if (disposed) return;
          status.textContent = error.message;
          // Failed submission or restart timeout returns controls to a recoverable state.
          setBusy(false);
          cancel.disabled = confirm.disabled = false;
        }
      });
      // Closing a submitted restart dialog must not imply the server operation was canceled.
      dialog.addEventListener("cancel", event => { if (busy && action === "restart") event.preventDefault(); });
      dialog.addEventListener("close", () => { dialog.remove(); if (modal === dialog) modal = null; });
      actions.append(cancel, confirm);
      dialog.append(title, description, status, actions);
      doc.body.append(dialog);
      modal = dialog;
      dialog.showModal();
      // Default focus stays on cancellation instead of a service-disrupting action.
      cancel.focus();
    }

    function createButton(template, action) {
      // Cloning DOM copies presentation, not React's handlers or component state.
      const button = template.cloneNode(true);
      // Remove routing and selected-state metadata; these are actions, not settings pages.
      for (const attribute of ["data-settings-panel-slug", "aria-current", "aria-selected", "data-state", "id"]) {
        button.removeAttribute(attribute);
      }
      button.classList.remove("bg-primary-ghost-hover", "font-medium");
      // A selected archive row omits hover classes; actions must always remain unselected.
      button.classList.add("font-normal", "hover:bg-primary-ghost-hover", "data-[state=open]:bg-primary-ghost-hover");
      button.dataset.backendAction = action;
      button.setAttribute("aria-label", labels[action]);
      button.disabled = busy;
      button.querySelector(".text-fade-truncate").textContent = labels[action];
      const slot = button.querySelector(".icon-leading-slot");
      // Preserve both official compact and leading wrappers, including their responsive sizes.
      const iconSlots = [...slot.querySelectorAll("svg")].map(svg => ({
        parent: svg.parentElement, width: svg.getAttribute("width"), height: svg.getAttribute("height")
      }));
      for (const svg of slot.querySelectorAll("svg")) svg.remove();
      loadIcon(action).then(icon => {
        // A slow icon response may finish after route changes or plugin disposal.
        if (disposed || !icon) return;
        for (const target of iconSlots) {
          const svg = doc.importNode(icon, true);
          svg.setAttribute("width", target.width);
          svg.setAttribute("height", target.height);
          svg.setAttribute("aria-hidden", "true");
          target.parent.replaceChildren(svg);
        }
      });
      button.addEventListener("click", () => openDialog(action));
      owned.add(button);
      return button;
    }

    function update() {
      frame = null;
      if (disposed) return;
      for (const button of owned) if (!button.isConnected) owned.delete(button);
      const archive = doc.querySelector('button[data-settings-panel-slug="data-controls"]');
      if (!archive) return;
      const parent = archive.parentElement;
      // Official navigation remounts on route changes; recreate only missing owned controls.
      for (const action of ["restart", "stop"]) {
        if (!parent.querySelector(`[data-backend-action="${action}"]`)) {
          parent.append(createButton(archive, action));
        }
      }
    }

    const observer = new win.MutationObserver(() => {
      // Conversation streaming must not schedule DOM scans for a settings-only feature.
      if (!win.location.pathname.includes("/settings")) return;
      if (frame === null) frame = win.requestAnimationFrame(update);
    });
    const install = () => { observer.observe(doc.body, { childList: true, subtree: true }); update(); };
    // Extension tags live in head and can execute before the body exists.
    if (doc.body) install();
    else doc.addEventListener("DOMContentLoaded", install, { once: true });
    const controller = {
      dispose() {
        // Cancel pending DOM work and prevent asynchronous restart checks from reloading later.
        disposed = true;
        observer.disconnect();
        doc.removeEventListener("DOMContentLoaded", install);
        if (frame !== null) win.cancelAnimationFrame(frame);
        for (const button of owned) button.remove();
        modal?.remove();
        if (win.__codexBrowserBackendControls === controller) delete win.__codexBrowserBackendControls;
      }
    };
    win.__codexBrowserBackendControls = controller;
    return controller;
  }

  // The client protocol is exercised independently; the DOM integration uses the real browser.
  if (typeof module === "object" && module.exports) module.exports = { createControlClient, installSettingsControls };
  else installSettingsControls(window, document);
})();
