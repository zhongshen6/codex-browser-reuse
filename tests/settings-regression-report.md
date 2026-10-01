# Settings Regression Verification

Date: 2026-09-30

## Scope

Backend: http://127.0.0.1:4387
Renderer: packaged 26.917.9434
CLI: 0.158.0-alpha.2.1
Browser: existing daily Edge tab

No model prompts or turns were started for these tests. Live model-dialogue
testing is reserved for the user.

## Confirmed Cause

The bridge handled bulk `get-settings` but not the official `get-setting`
reader. The latter returned an empty fallback, causing the renderer to use
defaults even when the bulk settings showed another value. Before repair,
followUpQueueMode was queue in config but steer in the execution reader.

## Changes And Evidence

- Single and bulk reads use the same fresh settings store and official response
  shapes. Official single reads returned queue, zh-CN, and always after repair.
- Writes go through CLI `config/batchWrite`, with whole-batch validation and
  read-back checks. Unsupported writes produce errors rather than fake success.
- Through the real settings page, queue mode, plain-text composer mode, and
  Enter behavior were changed and survived a browser reload.
- Test preferences were restored: queue, default Enter behavior, and default
  plain-text mode. The page was reloaded and showed queue selected, Enter, and
  the plain-text switch off. Model and access permissions remained unchanged.
- Structured light/dark Chrome themes retain official RGB color, contrast,
  semantic color, and font fields. Null font defaults are omitted for TOML and
  restored for the renderer. Object comparison ignores TOML key reordering.
- A real CLI app-server with a separate temporary CODEX_HOME successfully saved,
  read back, and reset a theme with default fonts and composer settings. Its
  temporary configuration was removed; the user's appearance was not changed.
- The renderer Ultra gate is enabled, but effort choices still follow the model
  catalog. The 5.6 Sol chooser exposed six efforts and Fast; 6 Sol exposed four
  efforts and no Fast. Ultra's official confirmation dialog was canceled.

## Automated Checks

20 tests passed, including settings and existing notification regression tests.
JavaScript syntax checks passed for server.js, bridge.js, and desktop-settings.js.

## Not Certified

- Actual follow-up queue scheduling, steering, Fast execution, and Ultra execution.
  The user performs those model-dialogue tests.
- Unsupported desktop-only settings and imported custom notification sounds.
  This change does not implement those capabilities.
