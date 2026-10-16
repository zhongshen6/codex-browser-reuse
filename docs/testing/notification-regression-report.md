# Notification Regression Report

Date: 2026-09-30. Target: browser reuse backend on port 4387 only.

## Environment

- Daily Edge browser, controlled through the authorized raw CDP connection.
- CLI: `0.158.0-alpha.2.1`.
- Windows notification identity: `CodexBrowserReuse.4387`.
- Test conversation: `01a0f1c6-d858-7843-980b-cb099c91e6ae`.
- Test commands were read-only service queries. No network access was performed.

## Repairs

The request adapter now preserves the CLI permission profile, environment fields,
and the permission-tool feature flag. A named permissions profile is not converted
into a sandbox mode. This removes the conflicting permissions and sandboxPolicy
combination and makes the real permission request tool available to the model.

Official sound resources are resolved from the installed CLI resource directory
before attempting to enumerate WindowsApps. Native toast audio is suppressed when
the host plays the selected official WAV, avoiding duplicate sounds.

## Real Model Tests

| Test | Interaction | Observed result |
| --- | --- | --- |
| A | Send through browser; approve in official frontend | Real permission request id 0. W32Time query exited 0. Model returned service status; completion toast emitted. |
| B | Send through browser; reject in official frontend | Real permission request id 1. Model returned cancellation; no commandExecution item. Completion toast emitted. |
| C | Send through browser; close every project tab; approve Windows toast | Backend clients empty. Approval forwarded to CLI. BITS query exited 0; model returned completion; Windows completion toast emitted with frontend still closed. |
| Open C | Activate Windows completion toast | Daily Edge opened the exact local conversation URL; final answer visible. No official Codex protocol URL used. |
| Reply | Close project tab; reply through Windows completion toast | Real new CLI turn returned the requested response. Correct conversation opened in daily Edge. |
| D | Send through browser; close every project tab; reject Windows toast | Backend clients empty. Empty permission grant forwarded. Model returned cancellation; no commandExecution item. Windows completion toast emitted. |
| Open D | Activate latest completion toast | Correct conversation opened with the cancellation and notification-reply results visible; no pending approval. |

Turn IDs:

- A: `01a0f1c6-dc73-7a13-8f30-0ed8db74bdb2`.
- B: `01a0f1ca-4cb2-7201-8060-b4774fa11d2f`.
- C: `01a0f1d1-582b-72e1-b9cb-2ccf8103e557`.
- Reply: `01a0f1d6-9691-76c2-a5a8-6a297942c594`.
- D: `01a0f1d7-4446-7aa0-888f-d9155c48b6e1`.

## Evidence And Limits

All model turns used real backend and CLI requests, not injected completion events.
Native actions were taken from Windows notification history and delivered through
the registered COM activator, the same callback used by toast buttons. This checks
the native activation chain, but is not a physical mouse hit-testing test.

Windows history confirmed the resolved approval toast was removed and the latest
completion toast contained a reply input and `audio silent="true"` after the sound
path repair. Resource lookup and sound-off behavior have automated coverage;
audible output was not independently recorded or listened to.

Screenshots:

- `notification-browser-approval.png`: browser approval UI.
- `notification-final-browser.png`: real final answers after native activation.

Logs: `../../logs/desktop-notifications.jsonl` and bridge diagnostic event endpoints.

## Automated Checks

`node --test tests/notification-routing.test.js`: 7 passed, 0 failed.

Coverage includes profile preservation, permission-tool feature preservation,
explicit sandbox/environment parameters, request id zero, session scope,
rejection shapes, browser open/reply routing, activation tokens, live notification
settings, and notification emission without frontend heartbeat.

JavaScript syntax checks passed for server, notification policy, and test code.
PowerShell parser checks passed for the native adapter and activation helper.

## End State

Backend and CLI running on 4387. No pending approval requests. One project
conversation tab retained in daily Edge. No work performed against port 4390.

The native notification appearance remains Windows-managed; buttons are currently
English. These tests do not certify every notification type or exact visual parity
with the official application. UAC prompting was not separately exercised because
the test environment automatically accepts it.

## Banner Follow-Up

The first run did not prove banner visibility: successful `Show` and toast history
entries were insufficient, and the user reported hearing only sound. The adapter
now registers a Start-menu shortcut with `System.AppUserModel.ID` matching
`CodexBrowserReuse.4387` at host startup. Missing per-app notification preference
values are initialized without overwriting existing Windows user choices.

The shell read-back confirmed the shortcut AUMID and notification setting
`Enabled`. A real browser turn (`01a0f1f6-0ab3-7113-be70-2183d9d088d7`) returned
the expected short response and appeared in the Windows notification center.
After a separate silent banner test was resent, the user explicitly confirmed
seeing the desktop banner through the confirmation dialog at 19:05 on 2026-09-30.
This is direct user confirmation, not an inference from `shown: true`.

The permission-tool availability issue in the user's older conversation was not
changed during this banner-only repair.

## MCP Approval Follow-Up

The user's ping approval used `mcpServer/elicitation/request`, not a CLI command
approval. The notifier previously ignored that method, so this specific request
emitted neither a toast nor audio. MCP tool approvals now use the permission
notification preference and the CLI elicitation response protocol.

Empty tool-approval forms offer allow once, decline, and session approval only
when advertised by the server. Session approval is not a permanent grant.
Forms requiring input, URL authentication, verification, and connector approvals
notify with an open-browser action instead of manufacturing an empty acceptance.
Native actions validate the original method and turn, rejecting stale request IDs.

Official frontend response construction and generated CLI response schemas were
checked before implementation. Accept returns `action: accept`, `content: {}`,
and `_meta: null`; decline returns `action: decline`, `content: null`, and
`_meta: null`. Session acceptance uses `_meta: {persist: session}`.

Real browser tests used conversation `01a0f151-849f-7192-a1e0-26a44a63d7ce`:

| Test | Interaction | Observed result |
| --- | --- | --- |
| E | Send an actual MCP ping request | User confirmed both approval banner and sound via dialog at 19:20:51. |
| G | Send through browser; decline via native COM callback | Request id 2 returned the decline elicitation response. CLI reported user rejected MCP tool call, duration 0, no ping result. Model returned cancellation and completion toast. |
| H | Send through browser; close the project tab; allow once via native COM callback | Request id 3 returned accept with empty content and no persistence. Real ping exited 0, received one packet, 28 ms. Model completed and emitted its toast while the project tab remained closed. |
| Open H | Activate completion through native COM callback | Daily Edge opened the exact local conversation URL and displayed the real ping result. No official app URL was used. |

Turn IDs:

- E: `01a0f20b-05fa-7cd1-a74f-5b230819d298`.
- G: `01a0f212-ee3c-7b70-90c3-b6de6884e53c`.
- H: `01a0f214-54e8-7de1-8a2c-67adeaabfa17`.

At 19:32:58 the user also confirmed both banner and sound for completion H.
Native COM coverage uses the actual toast arguments from Windows history; it does
not substitute a physical mouse click test. Session acceptance has automated
protocol coverage but was not granted in the live tests.

The history helper now loads the WinRT XML projection before reading toast
Content, enumerates the projected collection directly, and skips old entries
without readable Content. Unreadable historical entries no longer abort testing
of a valid current notification. Existing Windows notification preferences are
not overwritten by this change.

Automated routing checks: 11 passed, 0 failed. PowerShell parser checks passed.
No pending approvals remain; the final conversation tab is open in daily Edge.
