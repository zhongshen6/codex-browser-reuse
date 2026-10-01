const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const project = path.resolve(__dirname, "..");

test("sidebar performance plugin pauses official animations during scrolling", () => {
  const source = fs.readFileSync(
    path.join(project, "extensions", "plugins", "sidebar-performance.js"),
    "utf8"
  );
  assert.match(source, /data-codex-performance-scrolling/);
  assert.match(source, /animation:\s*none\s*!important/);
  assert.match(source, /addEventListener\('scroll', onScroll, \{ capture: true, passive: true \}\)/);
});

test("sidebar performance is enabled while Nahida remains opt-in", () => {
  const config = JSON.parse(
    fs.readFileSync(path.join(project, "extensions", "config.json"), "utf8")
  );
  assert.equal(config.plugins["sidebar-performance"], true);
  assert.equal(config.themes.nahida, false);
});
