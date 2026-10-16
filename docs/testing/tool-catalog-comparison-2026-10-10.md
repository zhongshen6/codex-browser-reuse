# Tool Catalog Comparison

## Result

Browser and terminal requests had identical top-level tool definitions after MCP
initialization. Four sampled deferred MCP tools also had identical complete
definitions, including descriptions and parameter schemas.

This establishes parity for the captured top-level declarations and four deferred
samples. It is not a complete audit of every deferred tool, restored session,
interactive TUI mode, or tool execution.

## Setup

- Date: 2026-10-10, Asia/Shanghai.
- Executable: the installed Codex desktop package's `app/resources/codex.exe`.
- Version: `codex-cli 0.162.0-alpha.17.2`.
- Model: `gpt-6-luna`, reasoning effort `medium`.
- Working directory: this project's root.
- Permissions: existing configuration, `danger-full-access` and approval `never`.
- Browser: actual official renderer in a separate daily Edge tab, through the
  production HTTP bridge on port 4387.
- Terminal: fresh `codex exec --ephemeral --json` processes using the same binary,
  model, home configuration and working directory.
- A loopback-only proxy on port 4398 forwarded requests to the existing configured
  provider. No provider credentials or global settings were modified.

The browser-side test wrapper changed only the test thread's working directory
and provider URL. It did not inject, remove or edit tool definitions.
An initial browser attempt missed the bridge's closure-local fetch and therefore
was not captured. The subsequent wrapper intercepted the renderer's actual
`electronBridge.sendMessageFromView` calls successfully.

## Captured Evidence

The first successful pair each contained 16 top-level entries:

`exec_command`, `write_stdin`, `list_mcp_resources`,
`list_mcp_resource_templates`, `read_mcp_resource`, `request_user_input`,
`request_plugin_install`, `apply_patch`, `view_image`, `collaboration`,
`get_goal`, `create_goal`, `update_goal`, `image_gen`, `tool_search`, `web_search`.

`collaboration` contains six member tools and `image_gen` contains one; 16 is a
top-level entry count, not an exhaustive callable-tool count.
Both requests used `tool_choice: auto` and `parallel_tool_calls: true`.

Initially, the terminal's discovery description advertised only `node_repl`,
while the already-running browser app-server advertised all four configured MCP
sources. Later terminal requests advertised `execution`, `idalib`, `node_repl`
and `raw_cdp_browser`; their entire top-level tool declarations then matched the
browser declarations under canonical JSON hashing.

The first terminal request in the later discovery capture also used a different
`request_plugin_install` parameter schema: `tool_type`, `action_type` and
`tool_id`, versus the browser's `plugin_id`. Subsequent captured requests matched
the browser schema. This additional startup-time variation was observed directly,
but its configuration/feature-resolution cause was not independently isolated;
do not attribute that schema change specifically to MCP loading.

Early cold-start searches sometimes returned no result. A subsequent terminal
run querying tools in a different order found all four, without retries.
The sequence is consistent with asynchronous MCP initialization rather than
the browser injecting additional tools.

The following deferred definitions were captured from actual `tool_search_output`
items subsequently sent to the model. Each matched between browser and terminal:

| Tool | Canonical SHA-256 |
| --- | --- |
| `mcp__execution.program_exec` | `7db49a93b23fef21dff981ace4d6261868d09abc85b7246fc9ee3aef79722a87` |
| `mcp__idalib.idb_list` | `cead5f0ffb53558b63d431aff8697191f190aaeb830b9818d7aa09a5ab2573a5` |
| `mcp__node_repl.js` | `bc7117d6bc917bf9ad567a7dffc14601e899d72efaa85093bbd616cbd12629e8` |
| `mcp__raw_cdp_browser.cdp_tabs` | `71e081dbb07f8bea97c41d39c90288fcab92cd15d80dd694dd219448a0ef9b58` |

No sampled MCP tool was executed. Successful model turns either replied with a
fixed acknowledgement or searched for tool declarations.
One terminal discovery attempt failed with an upstream policy rejection; its
partial results were not treated as a successful complete tool comparison.

## Artifacts and Cleanup

Local private captures:

- `logs/tool-catalog-probe-20261010-2230/requests.jsonl`
- `logs/tool-catalog-probe-20261010-discovery/requests.jsonl`

Captures retain tool definitions and selection settings, not messages,
instructions, request headers or authentication. Tool descriptions can still
contain machine-specific metadata, so the captures remain under ignored `logs/`.

The temporary listener was stopped, the browser wrapper restored, the two browser
test threads archived, and only the test tab closed. The user's original browser
tab and production backend were left running. Archived test threads still have
the diagnostic URL in their saved configuration and should not be resumed.

The reusable helper is `tools/tool-catalog-probe.js`; it is not part of startup.
For example, from the project root:

```powershell
.\runtime\node\node.exe .\tools\tool-catalog-probe.js compare .\logs\tool-catalog-probe-20261010-discovery\requests.jsonl
```

The report distinguishes first-request differences from the last observed
catalog and compares deferred namespace members individually.
The proxy refuses capture-file reuse, listens only on loopback, and expires
after 15 minutes if forgotten.

All 93 automated project tests passed after adding the diagnostic helper.
