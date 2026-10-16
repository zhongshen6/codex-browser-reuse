const { test } = require("node:test");
const assert = require("node:assert/strict");
const { adaptCoreRenderer } = require("../src/core-extension-adapters");

function loader(enabled) {
  return {
    isEnabled: (group, id) => enabled.has(`${group}/${id}`)
  };
}

test("core adapter registry only applies enabled source-level hooks", () => {
  const calls = [];
  const fakeLoader = loader(new Set(["plugins/example"]));
  const result = adaptCoreRenderer(fakeLoader, "initial", "official");
  assert.equal(result, "official");
  assert.deepEqual(calls, []);
});

test("core adapter registry is a separate boundary from ordinary runtime plugins", () => {
  const source = require("node:fs").readFileSync(
    require("node:path").join(__dirname, "../src/core-extension-adapters.js"), "utf8"
  );
  assert.match(source, /private renderer closures/);
  assert.match(source, /adaptCoreRenderer/);
  assert.doesNotMatch(source, /runtimeTags/);
});
