/*
 * File input and clipboard snapshot adapted from LibreChat (MIT).
 * Copyright (c) 2026 LibreChat. See docs/licenses/LibreChat-MIT.txt.
 * Upstream commit and adaptation scope: docs/attachments.md.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory;
  else root.__codexBrowserAttachments = factory(root);
})(typeof window === "object" ? window : globalThis, function createBrowserAttachments(host) {
  const MAX_BYTES = 16 * 1024 * 1024;
  let activePicker = null;

  function clipboardFiles(clipboardData) {
    if (!clipboardData) return [];
    const files = Array.from(clipboardData.files || []);
    // Some providers expose file items without populating the FileList.
    if (!files.length) {
      for (const item of Array.from(clipboardData.items || [])) {
        if (item.kind !== "file") continue;
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }
    const copiedFiles = [];
    // LibreChat's handlePaste copies File objects before asynchronous routing.
    // Preserve display names here; the official registry supplies unique directories.
    for (const file of files) {
      const newFile = new host.File([file], file.name, {
        type: file.type,
        lastModified: file.lastModified
      });
      copiedFiles.push(newFile);
    }
    return copiedFiles;
  }

  function snapshotTransfer(clipboardData) {
    // Only the file collector consumes this snapshot. Text stays on the original event.
    return { files: clipboardFiles(clipboardData), items: [] };
  }

  function validateFile(file) {
    if (!file || !Number.isFinite(file.size) || file.size < 0) {
      throw new Error("Unable to read attachment");
    }
    if (file.size > MAX_BYTES) throw new Error("Attachment exceeds the 16 MiB limit");
  }

  function pickFiles({ accept, allowMultiple = true, imagesOnly = false } = {}) {
    activePicker?.();
    return new Promise((resolve, reject) => {
      // Adapted from LibreChat's FileUpload component, without its React dependency.
      const input = host.document.createElement("input");
      input.multiple = allowMultiple;
      input.type = "file";
      input.style.display = "none";
      input.accept = accept?.join(",") || (imagesOnly ? "image/*" : "");
      input.setAttribute("data-browser-attachment-picker", "");
      let settled = false;
      let focusTimer;
      const finish = (files, error) => {
        if (settled) return;
        settled = true;
        host.clearTimeout(focusTimer);
        host.removeEventListener("focus", onFocus);
        input.remove();
        if (activePicker === cancel) activePicker = null;
        error ? reject(error) : resolve(files);
      };
      const cancel = () => finish([]);
      const onFocus = () => {
        // Older browsers lack input's cancel event. Give their change event time to run.
        if (!("oncancel" in input)) {
          focusTimer = host.setTimeout(() => finish(Array.from(input.files || [])), 500);
        }
      };
      input.addEventListener("change", () => {
        const files = Array.from(input.files || []);
        input.value = "";
        finish(files);
      }, { once: true });
      input.addEventListener("cancel", cancel, { once: true });
      host.addEventListener("focus", onFocus);
      activePicker = cancel;
      host.document.body.append(input);
      // Do not await RPC/network work before this call: Android requires user activation.
      try { input.click(); } catch (error) { finish([], error); }
    });
  }

  async function requireImagePath(pendingPath) {
    const filePath = await pendingPath;
    // A preview data URL is not proof that the CLI can access the image.
    if (typeof filePath !== "string" || !filePath) throw new Error("Unable to save image attachment");
    return filePath;
  }

  return { MAX_BYTES, clipboardFiles, snapshotTransfer, validateFile, pickFiles, requireImagePath };
});
