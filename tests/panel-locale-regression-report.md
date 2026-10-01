# Narrow Panel And Initial Locale Verification

Date: 2026-09-30
Backend: 4387

## Implemented

- The verified official `toggleMaximizeSidePanel` handler path is reused.
- Below 768 CSS pixels of workspace width, opening a right panel invokes the
  official full-width state action once.
- Manual exit is respected until the panel is closed and reopened.
- Automatically expanded panels restore split mode when enough width returns.
- Initial HTML declares `lang="zh-CN"`; runtime locale assignment is unchanged.
- The hook adapts the served renderer without modifying packaged source files.

## Live Browser Verification

Daily Edge was used through raw CDP with isolated same-origin iframe viewports.

- The right PDF panel expanded to 500px at 500px viewport width. Its official
  button reported `aria-label="退出全屏"` and `aria-pressed="true"`.
- Manual restore reported full-width false and remained split at 480px.
- Side chat was opened through the official launcher menu without sending a
  message. Closing and reopening the panel expanded it to 480px.
- Resizing that automatically expanded panel to 1200px restored split mode.
- Initial responses for `/` and `/settings/general-settings` declare zh-CN.
- The renderer still contains its original runtime locale assignment.

33 automated tests passed. No model prompt or turn was started.
Existing upstream rate-limit requests sometimes failed during testing; that
network error was not changed or suppressed by this repair.

Translation-prompt behavior needs actual browser/device confirmation. A default
language declaration is not a guarantee that browsers disable translation.
