const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { createRightPanelPolicy } = require("../extensions/plugins/right-panel/runtime");
const { adaptRightPanel } = require("../src/renderer-panel-adapter");

function fixture() {
  // Test policy decisions separately from the renderer's animation timing.
  const actions = [];
  const input = {
    scope: {}, isOpen: false, isFullWidth: false, allowFullWidth: true,
    workspaceWidth: 500, setFullWidth: value => actions.push(value)
  };
  const policy = createRightPanelPolicy();
  // Simulate the real action changing the official full-width atom immediately.
  const update = changes => {
    Object.assign(input, changes);
    const result = policy(input);
    if (result) input.isFullWidth = actions.at(-1);
    return result;
  };
  return { actions, input, update, policy };
}

test("narrow panel opening invokes the official action only once", () => {
  // Width changes during the opening animation must not issue another toggle.
  const f = fixture();
  f.update({});
  assert.equal(f.update({ isOpen: true }), "expand");
  f.update({});
  f.update({ workspaceWidth: 480 });
  assert.deepEqual(f.actions, [true]);
});

test("manual restore stays split until the panel is closed and opened again", () => {
  // Repeated layout notifications must not override the user's choice.
  const f = fixture();
  f.update({ isOpen: true });
  f.update({ isFullWidth: false });
  f.update({ workspaceWidth: 460 });
  assert.deepEqual(f.actions, [true]);
  f.update({ isOpen: false });
  f.update({ isOpen: true });
  assert.deepEqual(f.actions, [true, true]);
});

test("wide opening stays split; resizing can expand and restore automatic ownership", () => {
  // Test both exact sides of the workspace threshold.
  const f = fixture();
  f.update({ isOpen: true, workspaceWidth: 1000 });
  assert.deepEqual(f.actions, []);
  f.update({ workspaceWidth: 767 });
  assert.deepEqual(f.actions, [true]);
  f.update({ workspaceWidth: 768 });
  assert.deepEqual(f.actions, [true, false]);
  f.update({});
  assert.deepEqual(f.actions, [true, false]);
});

test("manual full width is not restored by policy and disallowed tabs stay untouched", () => {
  // Only state changes owned by the policy may be automatically restored.
  const f = fixture();
  f.update({ isOpen: true, isFullWidth: true, workspaceWidth: 1000 });
  assert.deepEqual(f.actions, []);
  f.update({ isFullWidth: false, workspaceWidth: 500, allowFullWidth: false });
  assert.deepEqual(f.actions, []);
});

test("scope isolation and wide reopening preserve the correct panel ownership", () => {
  // Closing a panel does not necessarily clear the official full-width atom.
  const f = fixture();
  f.update({ isOpen: true });
  f.update({ isOpen: false });
  f.update({ isOpen: true, workspaceWidth: 1000 });
  assert.deepEqual(f.actions, [true, false]);
  // Another conversation must not inherit the first conversation's handled flag.
  f.policy({ ...f.input, scope: {}, workspaceWidth: 500 });
  assert.deepEqual(f.actions, [true, false, true]);
});

test("invalid widths do not dispatch and unsupported renderer builds fail loudly", () => {
  // Transient missing dimensions are not evidence of a narrow workspace.
  const f = fixture();
  for (const width of [NaN, Infinity, 0, -1]) f.update({ isOpen: true, workspaceWidth: width });
  assert.deepEqual(f.actions, []);
  assert.throws(() => adaptRightPanel("unrecognized build"), /signature changed/);
});

test("packaged hook uses the actual toggle handler and leaves runtime locale untouched", () => {
  // Verify signatures against the pinned source without writing to that source.
  const file = path.resolve(__dirname,
    "../runtime/codex-frontend-26.917.9434/webview/assets/app-initial-fc9a33fdda88.js");
  const original = fs.readFileSync(file, "utf8");
  const adapted = adaptRightPanel(original);
  assert.equal(adapted.includes("setFullWidth:full=>era(i,full)"), true);
  assert.equal(adapted.includes("document.documentElement.lang=x"), true);
  assert.equal(original.includes("__codexBrowserRightPanelPolicy"), false);
});
