const { HOST_FETCH_REQUESTS } = require("./host-fetch");

// Keep verified contracts separate from unknown requests and upstream failures.
const REQUEST_ADAPTATIONS = [
  {
    kind: "mcp-request", key: "app/list", state: "cli-forward",
    implementation: "src/bridge.js", tests: "tests/unsupported-requests.test.js",
    contract: "Codex app-server app/list", errorPolicy: "Preserve the original CLI error; do not synthesize apps."
  },
  ...[...HOST_FETCH_REQUESTS].map(key => ({
    kind: "fetch", key: `/${key}`, state: "local-adapter",
    implementation: key === "third-party-notices" || key === "wsl-bash-availability"
      ? "src/host-capabilities.js" : "src/host-fetch.js",
    tests: key === "third-party-notices" || key === "wsl-bash-availability"
      ? "tests/host-capabilities.test.js" : "tests/host-fetch.test.js",
    contract: "Codex desktop 26.917.9434 host fetch"
  })),
  ...["detect", "status", "import", "imported-connectors", "start"].map(action => ({
    kind: "fetch", key: `/external-agent-import-${action}`, state: "disabled",
    extension: "disable-agent-import", implementation: "src/renderer-agent-import-adapter.js",
    tests: "tests/disable-agent-import.test.js",
    contract: "Excluded external-agent import UI; disable query sources, reject escaped calls."
  }))
];

function requestAdaptations(loader) {
  // The documentation follows the real switch, rather than claiming a disabled
  // feature stays disabled after the user opts into its official UI.
  return REQUEST_ADAPTATIONS.map(entry => ({
    ...entry,
    ...(entry.extension ? { enabled: loader.isEnabled("plugins", entry.extension) } : {})
  }));
}

module.exports = { REQUEST_ADAPTATIONS, requestAdaptations };
