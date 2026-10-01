const fs = require("node:fs");
const { parse } = require("smol-toml");

// These keys and enum values come from the packaged 26.917.9434 setting
// descriptors. Only settings with an implemented browser consumer are writable.
// Missing values deliberately retain the official renderer's own defaults.
const boolean = value => typeof value === "boolean";
const string = value => typeof value === "string";
const oneOf = values => value => values.includes(value);
const strings = value => Array.isArray(value) && value.every(string);
const range = (min, max) => value =>
  typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
const recordWithExactKeys = (shape, value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  if (Object.keys(value).some(key => !Object.hasOwn(shape, key))) return false;
  return Object.entries(shape).every(([key, validator]) =>
    value[key] === undefined ? validator.optional === true : validator(value[key])
  );
};
const optional = validator => {
  const wrapped = value => validator(value);
  wrapped.optional = true;
  return wrapped;
};
const fontFace = value => recordWithExactKeys({
  family: string,
  fullName: string,
  postscriptName: string
}, value);
// Match the packaged Chrome theme schema: RGB hex colors and contrast 0-100.
const color = value => string(value) && /^#[0-9a-fA-F]{6}$/.test(value);
const chromeTheme = value => recordWithExactKeys({
  accent: color,
  accentSource: optional(oneOf(["chatgpt", "custom"])),
  contrast: value => Number.isSafeInteger(value) && value >= 0 && value <= 100,
  fonts: value => recordWithExactKeys({
    code: value => value === null || string(value),
    codeFace: optional(fontFace),
    content: optional(value => value === null || string(value)),
    contentFace: optional(fontFace),
    ui: value => value === null || string(value),
    uiFace: optional(fontFace)
  }, value),
  ink: color,
  opaqueWindows: boolean,
  semanticColors: value => recordWithExactKeys({
    diffAdded: color,
    diffRemoved: color,
    skill: color
  }, value),
  surface: color
}, value);
const themeKeys = new Set(["appearanceLightChromeTheme", "appearanceDarkChromeTheme"]);
const normalizeSetting = (key, value) => {
  if (!themeKeys.has(key) || !value?.fonts) return value;
  // TOML has no null; omitted font names represent the renderer's default font.
  // Restore nullable fields on reads so the official schema accepts the object.
  return { ...value, fonts: { code: null, ui: null, content: null, ...value.fonts } };
};
const cliSetting = (key, value) => {
  if (!themeKeys.has(key) || value === null) return value;
  return { ...value, fonts: Object.fromEntries(
    Object.entries(value.fonts).filter(([, font]) => font !== null)
  ) };
};
const stableJson = value => JSON.stringify(value, (key, nested) => {
  // TOML may reorder tables. Compare values without treating key order as data.
  if (!nested || typeof nested !== "object" || Array.isArray(nested)) return nested;
  return Object.fromEntries(Object.keys(nested).sort().map(name => [name, nested[name]]));
});
const validators = {
  localeOverride: string,
  appearanceTheme: oneOf(["system", "light", "dark"]),
  appearanceLightChromeTheme: chromeTheme,
  appearanceDarkChromeTheme: chromeTheme,
  sansFontSize: range(11, 16),
  codeFontSize: range(8, 24),
  useFontSmoothing: boolean,
  usePointerCursors: boolean,
  appearanceLightCodeThemeId: string,
  appearanceDarkCodeThemeId: string,
  appearanceDiffMarkerStyle: oneOf(["color", "symbols"]),
  "reduced-motion-preference": oneOf(["system", "on", "off"]),
  integratedTerminalShell: oneOf(["powershell", "commandPrompt", "gitBash", "wsl"]),
  defaultTerminalLocation: oneOf(["bottom", "right"]),
  followUpQueueMode: oneOf(["queue", "steer", "interrupt"]),
  composerEnterBehavior: oneOf(["enter", "cmdIfMultiline", "cmdAlways"]),
  composerPlainTextMode: boolean,
  conversationDetailMode: oneOf(["STEPS_PROSE", "STEPS_COMMANDS", "STEPS_EXECUTION"]),
  reviewDelivery: oneOf(["inline", "detached"]),
  "show-context-window-usage": boolean,
  "show-educational-tips": boolean,
  "ambient-suggestions-enabled": boolean,
  "notifications-turn-mode": oneOf(["off", "unfocused", "always"]),
  "notifications-permissions-enabled": boolean,
  "notifications-questions-enabled": boolean,
  // Custom native sound imports are not implemented. Never report them saved.
  "notifications-sound": oneOf(["default", "classic", "none", "Basso", "Glass", "Ping", "Pop", "Purr", "Tink"]),
  "git-show-sidebar-pr-icons": boolean,
  "toys-confetti-enabled": boolean,
  "enabled-reasoning-efforts": value => strings(value) && value.every(oneOf([
    "none", "minimal", "low", "medium", "high", "xhigh", "max", "ultra", "persistent"
  ])),
  "default-mode-request-user-input-enabled": boolean,
  "default-service-tier": string
};

function validateSettings(values) {
  if (!values || typeof values !== "object" || Array.isArray(values)) {
    throw new Error("Settings must be an object");
  }
  for (const [key, value] of Object.entries(values)) {
    if (!Object.hasOwn(validators, key)) throw new Error(`Unsupported browser setting: ${key}`);
    // A null write means reset/unset, not the string "null" in config.toml.
    if (value !== null && !validators[key](value)) throw new Error(`Invalid setting value: ${key}`);
  }
  return values;
}

function createDesktopSettings({ configPath, sendRequest }) {
  let writes = Promise.resolve();
  const read = () => {
    let source;
    try {
      source = fs.readFileSync(configPath, "utf8");
    } catch (error) {
      if (error.code === "ENOENT") return {};
      throw error;
    }
    // Parse the entire document, including multiline strings and arrays.
    // Malformed configuration must surface as an error, not empty defaults.
    const desktop = parse(source).desktop || {};
    return Object.fromEntries(Object.entries(desktop)
      .filter(([key]) => Object.hasOwn(validators, key))
      .map(([key, value]) => [key, normalizeSetting(key, value)]));
  };
  const write = values => {
    // Validate the whole batch before any write. An unknown key must not
    // silently disappear while the HTTP endpoint reports success.
    const updates = structuredClone(validateSettings(values));
    const operation = writes.then(async () => {
      if (!Object.keys(updates).length) return read();
      // Delegate serialization, comment preservation, reset, and file updates
      // to the same CLI configuration writer used by the official frontend.
      const reply = await sendRequest({
        method: "config/batchWrite",
        params: {
          edits: Object.entries(updates).map(([key, value]) => ({
            keyPath: `desktop.${key}`, value: cliSetting(key, value), mergeStrategy: "replace"
          })),
          filePath: configPath,
          expectedVersion: null,
          reloadUserConfig: true
        }
      });
      if (reply.error) throw new Error(reply.error.message || "CLI setting write failed");
      const saved = read();
      // Read-back is essential: do not trust a success-shaped RPC that did
      // not actually persist the requested setting or remove a reset value.
      for (const [key, value] of Object.entries(updates)) {
        if (value === null ? Object.hasOwn(saved, key) :
          stableJson(saved[key]) !== stableJson(normalizeSetting(key, value))) {
          throw new Error(`CLI did not persist setting: ${key}`);
        }
      }
      return saved;
    });
    // A rejected write must not poison subsequent saves; serialization also
    // prevents concurrent setting changes from racing the shared config file.
    writes = operation.catch(() => {});
    return operation;
  };
  return { read, write };
}

module.exports = { createDesktopSettings, validateSettings };
