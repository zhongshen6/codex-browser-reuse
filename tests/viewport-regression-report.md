# Browser Viewport Regression

Date: 2026-09-30
Backend: 4387

## Cause And Repair

The official app shell sets an inline height of
`calc(100vh / var(--codex-window-zoom))`. All routes share this shell.
The browser adapter overrides that height using the current visible viewport,
preserves application zoom, and leaves packaged renderer assets unchanged.
Dynamic viewport CSS is the fallback. Pinch zoom does not drive layout resizing.

The HTML viewport declaration now requests keyboard layout resizing.
The small-height home layout also reduces its welcome gap and, below 320px,
hides the welcome area to preserve composer space.

## Verification

Existing daily Edge was used through raw CDP. Separate same-origin iframe
viewports provided controlled layout sizes without modifying the user's chat.
These are layout tests, not hardware mobile-toolbar or keyboard emulation.

| Route | Viewport | Shell bottom | Composer bottom |
| --- | --- | --- | --- |
| Home | 393x740 | 740 | 724 |
| Home | 393x360 | 360 | 344 |
| Home | 393x260 | 260 | 244 |
| Existing conversation | 393x360 | 360 | 344 |
| Settings | 393x740 | 740 | n/a |
| Home | 1280x800 | 800 | 784 |
| Home with 125% app zoom | 1280x800 | 800 | 780 |

Before the repair, home at 393x360 put the composer bottom at approximately
407px. After repair, its scrolling container has no extra overflow at that size.
Controlled oversized inline shell heights no longer override the adapter.

26 automated tests passed, including viewport measurement, pinch handling,
event batching, lifecycle cleanup, settings, and notification regressions.
All served routes include the viewport CSS, script, and updated metadata.

No prompts or model turns were started. Existing test preferences were not
changed. The 4387 backend was restarted to load the new compatibility routes.

## Device Confirmation

The user tested on the actual device and reported that everything was working
normally after the repair. This is user-reported device verification, in
addition to the controlled layout tests above.

## Residual Scope

At extremely small heights an expanded or unusually tall composer may still
require its internal scrolling. This repair does not redesign all mobile panels.

During testing, the existing upstream rate-limit request sometimes failed.
That error is unrelated to viewport layout and was not hidden or changed.
