const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { snapshot, summarize, compare } = require("../tools/tool-catalog-probe");

test("probe retains tool definitions but not messages or authentication", () => {
  // Only selected tool fields may cross the capture boundary.
  const record = snapshot({ model: "test-model", input: "private",
    instructions: "private", authorization: "private",
    tools: [{ type: "function", name: "test_tool" }] }, "browser");
  assert.equal(record.route, "browser");
  assert.equal(record.tools[0].name, "test_tool");
  assert.equal(JSON.stringify(record).includes("private"), false);
});

test("comparison ignores key order but detects actual schema changes", () => {
  // Wire serialization order must not create false schema differences.
  const a = { tools: [{ type: "function", name: "one", parameters: { type: "object", properties: {} } }] };
  const b = { tools: [{ parameters: { properties: {}, type: "object" }, name: "one", type: "function" }] };
  assert.deepEqual(summarize(a), summarize(b));
  b.tools[0].parameters.properties.value = { type: "string" };
  assert.notEqual(summarize(a)[0].hash, summarize(b)[0].hash);
});

test("deferred discovery captures definitions without unrelated input items", () => {
  // Discovery schemas are evidence, while user messages and search queries are not.
  const record = snapshot({ input: [
    { type: "message", content: "private" },
    { type: "tool_search_call", arguments: "private" },
    { type: "tool_search_output", tools: [{ type: "function", name: "mcp_test" }] }
  ] }, "terminal");
  assert.equal(record.discoveries[0].tools[0].name, "mcp_test");
  assert.equal(JSON.stringify(record).includes("private"), false);
});

test("report distinguishes startup timing and compares partial namespace members", t => {
  // Fixtures use an isolated temporary folder and never contact the model service.
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "tool-catalog-probe-"));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const file = path.join(directory, "requests.jsonl");
  const tool = description => ({ type: "tool_search", description });
  // Multiple fragments of one namespace must not overwrite earlier tool members.
  const discovery = name => ({ tools: [{ type: "namespace", name: "mcp_test",
    tools: [{ type: "function", name, parameters: { type: "object" } }] }] });
  const rows = [
    { route: "browser", tools: [tool("ready")], discoveries: [discovery("one"), discovery("two")] },
    { route: "terminal", tools: [tool("loading")], discoveries: [] },
    { route: "terminal", tools: [tool("ready")], discoveries: [discovery("one"), discovery("two")] }
  ];
  fs.writeFileSync(file, rows.map(row => JSON.stringify(row)).join("\n"));
  const result = compare(file);
  // Keep startup evidence while recognizing parity after initialization settles.
  assert.equal(result.initial.differentDefinitions.length, 1);
  assert.deepEqual(result.differentDefinitions, []);
  assert.equal(result.deferred.browser.length, 2);
  assert.deepEqual(result.deferred.differentDefinitions, []);
});
