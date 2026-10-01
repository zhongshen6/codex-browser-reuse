const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { parse, stringify } = require("smol-toml");
const { createDesktopSettings, validateSettings } = require("../desktop-settings");

// Parsed TOML tables have null prototypes and may change property order.
// Compare only their JSON values, as the browser transport does.
const canonicalJson = value => JSON.stringify(value, (key, nested) => {
  if (!nested || typeof nested !== "object" || Array.isArray(nested)) return nested;
  return Object.fromEntries(Object.keys(nested).sort().map(name => [name, nested[name]]));
});

function fixture(t, source, send) {
  // Each test owns an isolated config; never touch the user's real preferences.
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "codex-settings-"));
  const configPath = path.join(directory, "config.toml");
  fs.writeFileSync(configPath, source);
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const requests = [];
  const store = createDesktopSettings({
    configPath,
    sendRequest: async request => {
      requests.push(request);
      if (send) return send(request, configPath);
      // The fixture simulates CLI persistence only. Production never
      // serializes TOML itself; native writer coverage uses the live CLI.
      const document = parse(fs.readFileSync(configPath, "utf8"));
      document.desktop ||= {};
      for (const edit of request.params.edits) {
        const key = edit.keyPath.slice("desktop.".length);
        if (edit.value === null) delete document.desktop[key];
        else document.desktop[key] = edit.value;
      }
      fs.writeFileSync(configPath, stringify(document));
      return { result: {} };
    }
  });
  return { store, requests, configPath };
}

test("settings parse multiline TOML and preserve missing defaults", t => {
  // Absent keys must reach the renderer as absent, not invented fallback values.
  const { store } = fixture(t, `
model = "unchanged"
[desktop]
followUpQueueMode = "queue"
localeOverride = 'zh-CN'
enabled-reasoning-efforts = [
  "low", # inline comment
  "max", "ultra",
]
`);
  assert.deepEqual(store.read(), {
    followUpQueueMode: "queue", localeOverride: "zh-CN",
    "enabled-reasoning-efforts": ["low", "max", "ultra"]
  });
  assert.equal(Object.hasOwn(store.read(), "composerEnterBehavior"), false);
});

test("settings save supported controls through config batch RPC", async t => {
  // Verify the outbound contract as well as disk state and unrelated config.
  const f = fixture(t, 'model = "unchanged"\n[desktop]\nfollowUpQueueMode = "queue"\n');
  const saved = await f.store.write({
    composerEnterBehavior: "cmdAlways", composerPlainTextMode: true
  });
  assert.equal(saved.composerEnterBehavior, "cmdAlways");
  assert.equal(saved.composerPlainTextMode, true);
  assert.equal(parse(fs.readFileSync(f.configPath, "utf8")).model, "unchanged");
  assert.equal(f.requests[0].method, "config/batchWrite");
  assert.equal(f.requests[0].params.reloadUserConfig, true);
  assert.equal(f.requests[0].params.filePath, f.configPath);
  assert.deepEqual(f.requests[0].params.edits[0], {
    keyPath: "desktop.composerEnterBehavior", value: "cmdAlways", mergeStrategy: "replace"
  });
  assert.deepEqual(f.store.read(), saved);
});

test("structured Chrome appearance themes round-trip with official field shape", async t => {
  // Custom font metadata is part of the official theme object, not a scalar.
  const f = fixture(t, "[desktop]\n");
  const theme = {
    accent: "#8fc967",
    accentSource: "custom",
    contrast: 0,
    fonts: {
      code: "JetBrains Mono",
      codeFace: {
        family: "JetBrains Mono",
        fullName: "JetBrains Mono Regular",
        postscriptName: "JetBrainsMono-Regular"
      },
      content: null,
      ui: "Inter"
    },
    ink: "#264332",
    opaqueWindows: false,
    semanticColors: {
      diffAdded: "#4c9a62",
      diffRemoved: "#c45f5f",
      skill: "#b28a3b"
    },
    surface: "#f7fcf5"
  };
  const saved = await f.store.write({
    appearanceLightChromeTheme: theme,
    appearanceDarkChromeTheme: theme
  });
  assert.equal(canonicalJson(saved.appearanceLightChromeTheme), canonicalJson(theme));
  assert.equal(canonicalJson(saved.appearanceDarkChromeTheme), canonicalJson(theme));
  assert.throws(() => f.store.write({
    appearanceLightChromeTheme: { ...theme, fonts: { ...theme.fonts, unexpected: true } }
  }), /Invalid/);
  assert.throws(() => f.store.write({
    appearanceLightChromeTheme: { ...theme, contrast: 101 }
  }), /Invalid/);
  assert.throws(() => f.store.write({
    appearanceLightChromeTheme: { ...theme, accent: "red" }
  }), /Invalid/);
});

test("default Chrome fonts omit TOML nulls and restore the renderer schema", async t => {
  const f = fixture(t, "[desktop]\n");
  const theme = {
    accent: "#8fc967", contrast: 0, fonts: { code: null, ui: null, content: null },
    ink: "#264332", opaqueWindows: true, surface: "#f7fcf5",
    semanticColors: { diffAdded: "#4c9a62", diffRemoved: "#c45f5f", skill: "#b28a3b" }
  };
  // The CLI rejects nested JSON nulls, unlike a top-level reset operation.
  // The renderer still requires nullable code/ui fields on the return path.
  const saved = await f.store.write({ appearanceLightChromeTheme: theme });
  assert.deepEqual(f.requests[0].params.edits[0].value.fonts, {});
  assert.equal(canonicalJson(saved.appearanceLightChromeTheme), canonicalJson(theme));
  assert.doesNotThrow(() => validateSettings(saved));
});

test("reset removes cached settings instead of storing a null string", async t => {
  // Top-level null is the CLI reset operation; nested theme nulls differ.
  const f = fixture(t, '[desktop]\ncomposerEnterBehavior = "cmdAlways"\n');
  const saved = await f.store.write({ composerEnterBehavior: null });
  assert.equal(Object.hasOwn(saved, "composerEnterBehavior"), false);
  assert.equal(f.requests[0].params.edits[0].value, null);
});

test("unknown and invalid settings fail before any partial save", async t => {
  // A mixed invalid batch must not save its valid prefix and then fail.
  const f = fixture(t, "[desktop]\n");
  assert.throws(() => f.store.write({ composerPlainTextMode: true, invented: true }), /Unsupported/);
  assert.throws(() => f.store.write({ followUpQueueMode: "send-now" }), /Invalid/);
  assert.throws(() => validateSettings({ sansFontSize: 100 }), /Invalid/);
  assert.throws(() => validateSettings({ "notifications-sound": { fileName: "x.wav" } }), /Invalid/);
  assert.throws(() => validateSettings({ "enabled-reasoning-efforts": ["fake"] }), /Invalid/);
  assert.equal(f.requests.length, 0);
});

test("CLI errors and silent failures are not reported as saved", async t => {
  // Exercise both explicit failures and a success reply without persistence.
  const error = fixture(t, "[desktop]\n", async () => ({ error: { message: "denied" } }));
  await assert.rejects(error.store.write({ composerPlainTextMode: true }), /denied/);
  const silent = fixture(t, "[desktop]\n", async () => ({ result: {} }));
  await assert.rejects(silent.store.write({ composerPlainTextMode: true }), /did not persist/);
});

test("failed saves do not poison the next save and concurrent saves serialize", async t => {
  // Count active writers to detect races even when final values look correct.
  let active = 0;
  let maximum = 0;
  let calls = 0;
  const f = fixture(t, "[desktop]\n", async (request, file) => {
    calls += 1;
    if (calls === 1) return { error: { message: "first failed" } };
    active += 1;
    maximum = Math.max(maximum, active);
    await new Promise(resolve => setTimeout(resolve, 10));
    const doc = parse(fs.readFileSync(file, "utf8"));
    for (const edit of request.params.edits) doc.desktop[edit.keyPath.slice(8)] = edit.value;
    fs.writeFileSync(file, stringify(doc));
    active -= 1;
    return { result: {} };
  });
  await assert.rejects(f.store.write({ composerPlainTextMode: true }), /first failed/);
  await Promise.all([
    f.store.write({ composerPlainTextMode: true }),
    f.store.write({ composerEnterBehavior: "cmdAlways" })
  ]);
  assert.equal(maximum, 1);
  assert.equal(f.store.read().composerPlainTextMode, true);
  assert.equal(f.store.read().composerEnterBehavior, "cmdAlways");
});

test("fresh reads notice another client and malformed TOML is not hidden", t => {
  // The native app may edit the same file; startup-only caches cannot be trusted.
  const f = fixture(t, '[desktop]\nfollowUpQueueMode = "queue"\n');
  fs.writeFileSync(f.configPath, '[desktop]\nfollowUpQueueMode = "steer"\n');
  assert.equal(f.store.read().followUpQueueMode, "steer");
  fs.writeFileSync(f.configPath, "[desktop\n");
  assert.throws(() => f.store.read());
});
