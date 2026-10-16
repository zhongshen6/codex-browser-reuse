const { test } = require("node:test");
const assert = require("node:assert/strict");
const { File } = require("node:buffer");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const createAttachments = require("../extensions/plugins/browser-attachments/runtime");
const { adaptAttachmentInitial, adaptAttachmentPrimary } = require("../src/renderer-attachment-adapter");

function fixture() {
  const inputs = [];
  const listeners = new Map();
  const host = {
    File, setTimeout, clearTimeout,
    addEventListener: (name, fn) => listeners.set(name, fn),
    removeEventListener: (name, fn) => {
      if (listeners.get(name) === fn) listeners.delete(name);
    },
    document: {
      body: { append: input => inputs.push(input) },
      createElement: () => {
        const events = new Map();
        return {
          style: {}, files: [], oncancel: null, value: "",
          setAttribute() {},
          addEventListener: (name, fn) => events.set(name, fn),
          dispatch: name => events.get(name)?.(),
          click() { this.clicked = true; },
          remove() { this.removed = true; }
        };
      }
    }
  };
  return { api: createAttachments(host), inputs, listeners };
}

test("clipboard snapshots survive event expiry and preserve names, bytes and empty files", async () => {
  const { api } = fixture();
  const source = [
    new File(["hello"], "notes.txt", { type: "text/plain", lastModified: 123 }),
    new File([], "empty.txt"),
    new File([Uint8Array.of(0, 255)], "image.png", { type: "image/png" })
  ];
  const clipboard = { files: source.slice() };
  // The underlying protected event can disappear after this synchronous call.
  const copy = api.snapshotTransfer(clipboard);
  clipboard.files.length = 0;
  assert.deepEqual(copy.files.map(file => file.name), source.map(file => file.name));
  assert.notEqual(copy.files[0], source[0]);
  assert.equal(copy.files[0].lastModified, 123);
  assert.equal(await copy.files[0].text(), "hello");
  assert.equal(copy.files[1].size, 0);
  assert.deepEqual(new Uint8Array(await copy.files[2].arrayBuffer()), Uint8Array.of(0, 255));
});

test("file-item fallback works while text-only paste remains untouched", () => {
  const { api } = fixture();
  const file = new File(["one"], "one.txt");
  let textRead = false;
  // File retrieval must not touch HTML/plain-text data owned by the official editor.
  const transfer = {
    files: [], getData() { textRead = true; },
    items: [{ kind: "string" }, { kind: "file", getAsFile: () => file },
      { kind: "file", getAsFile: () => null }]
  };
  assert.equal(api.clipboardFiles(transfer).length, 1);
  assert.equal(textRead, false);
  assert.deepEqual(api.clipboardFiles({ files: [], items: [{ kind: "string" }] }), []);
  assert.deepEqual(api.clipboardFiles(null), []);
});

test("picker opens synchronously with image, extension and multi-file options", async () => {
  const { api, inputs, listeners } = fixture();
  const pending = api.pickFiles({ imagesOnly: true });
  const input = inputs.at(-1);
  // No host RPC is awaited between a user click and the platform picker.
  assert.equal(input.clicked, true);
  assert.equal(input.type, "file");
  assert.equal(input.multiple, true);
  assert.equal(input.accept, "image/*");
  const file = new File(["a"], "photo.png");
  input.files = [file];
  input.dispatch("change");
  assert.deepEqual(await pending, [file]);
  assert.equal(input.removed, true);
  assert.equal(listeners.size, 0);
  assert.equal(input.value, "");
  const second = api.pickFiles({ accept: [".txt", ".pdf"], allowMultiple: false });
  assert.equal(inputs.at(-1).accept, ".txt,.pdf");
  assert.equal(inputs.at(-1).multiple, false);
  inputs.at(-1).dispatch("cancel");
  assert.deepEqual(await second, []);
});

test("cancel, replacement and repeated selection do not leak picker inputs", async () => {
  const { api, inputs } = fixture();
  const first = api.pickFiles();
  const second = api.pickFiles();
  // Only one outstanding selection is allowed, without leaving an unresolved promise.
  assert.deepEqual(await first, []);
  assert.equal(inputs[0].removed, true);
  const file = new File(["same"], "same.txt");
  inputs[1].files = [file];
  inputs[1].dispatch("change");
  assert.deepEqual(await second, [file]);
  const third = api.pickFiles();
  inputs[2].files = [file];
  inputs[2].dispatch("change");
  assert.deepEqual(await third, [file]);
});

test("size validation precedes reads and image readiness requires a backend path", async () => {
  const { api } = fixture();
  api.validateFile({ size: 0 });
  api.validateFile({ size: api.MAX_BYTES });
  assert.throws(() => api.validateFile({ size: api.MAX_BYTES + 1 }), /16 MiB/);
  assert.throws(() => api.validateFile(null), /read attachment/);
  let complete;
  let settled = false;
  const result = api.requireImagePath(new Promise(resolve => { complete = resolve; }))
    .then(value => { settled = true; return value; });
  // Preview generation alone must not allow an unfinished image attachment to settle.
  await Promise.resolve();
  assert.equal(settled, false);
  complete("C:/backend/attachments/image.png");
  assert.equal(await result, "C:/backend/attachments/image.png");
  await assert.rejects(api.requireImagePath(Promise.resolve(null)), /save image/);
  await assert.rejects(api.requireImagePath(Promise.reject(new Error("upload failed"))), /upload failed/);
});

test("pinned adapters enable the official managed upload without rewriting runtime files", () => {
  const root = path.join(__dirname, "../runtime/codex-frontend-26.917.9434/webview/assets");
  for (const [name, adapt] of [
    ["app-initial-fc9a33fdda88.js", adaptAttachmentInitial],
    ["app-primary-a7ff54c980af.js", adaptAttachmentPrimary]
  ]) {
    const original = fs.readFileSync(path.join(root, name), "utf8");
    const adapted = adapt(original);
    assert.notEqual(adapted, original);
    // Parse the full official ES module, not just the replacement fragments.
    const parsed = spawnSync(process.execPath, ["--input-type=module", "--check"], {
      input: adapted, encoding: "utf8"
    });
    assert.equal(parsed.status, 0, parsed.stderr);
    assert.equal(fs.readFileSync(path.join(root, name), "utf8"), original);
    assert.throws(() => adapt("unexpected build"), /signature changed/);
    assert.throws(() => adapt(original + original), /signature changed/);
  }
});

test("server serves the adapter before modules and bridge no longer replays file events", () => {
  const server = fs.readFileSync(path.join(__dirname, "../src/server.js"), "utf8");
  const bridge = fs.readFileSync(path.join(__dirname, "../src/bridge.js"), "utf8");
  // Retain image fallback, but ordinary files now go through the official CLI transport.
  assert.ok(server.includes('createExtensionLoader'));
  assert.ok(server.includes("runtimeTags(deployment)"));
  assert.doesNotMatch(bridge, /stageBrowserFile|__browserReuseStaged|new ClipboardEvent/);
  assert.doesNotMatch(server, /__bridge\/file-attachment/);
});

test("attachment controls keep the official delete button usable on touch screens", () => {
  const source = fs.readFileSync(
    path.join(__dirname, "../extensions/plugins/attachment-controls/style.css"), "utf8"
  );
  // Visibility is now a normal plugin override, not another bundle patch.
  assert.match(source, /opacity:\s*1\s*!important/);
  assert.match(source, /pointer-events:\s*auto\s*!important/);
  assert.match(source, /composer-attachment-surface/);
});
