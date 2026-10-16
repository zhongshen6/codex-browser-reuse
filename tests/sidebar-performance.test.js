const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const project = path.resolve(__dirname, "..");

test("sidebar performance plugin pauses official animations during scrolling", () => {
  const source = fs.readFileSync(
    path.join(project, "extensions", "plugins", "sidebar-performance", "runtime.js"),
    "utf8"
  );
  assert.match(source, /data-codex-performance-scrolling/);
  assert.match(source, /animation:\s*none\s*!important/);
  assert.match(source, /addEventListener\('scroll', onScroll, \{ capture: true, passive: true \}\)/);
  // Geometry reads are deliberately left to the browser. A global prototype
  // override can corrupt unrelated layout and hides the real cost in traces.
  assert.doesNotMatch(source, /Element\.prototype\.getBoundingClientRect/);
});

test("sidebar performance is independently disabled while Nahida remains opt-in", () => {
  const config = JSON.parse(
    fs.readFileSync(path.join(project, "extensions", "config.json"), "utf8")
  );
  // The optimizer is currently disabled for a clean ResizeObserver baseline;
  // the theme remains independently disabled until it is explicitly enabled.
  assert.equal(config.plugins["sidebar-performance"], false);
  assert.equal(config.themes.nahida, false);
});
