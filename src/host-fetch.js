const path = require("node:path");
const { createHash, randomUUID } = require("node:crypto");
const { resolveMx } = require("node:dns/promises");

const HOST_FETCH_REQUESTS = new Set([
  "ensure-directory", "git-origins", "worktree-shell-environment-config",
  "codex-command-keymap-state", "email-domain-mail-provider", "ambient-suggestions",
  "projectless-thread-cwd", "projectless-workspace-root",
  "wsl-bash-availability", "third-party-notices"
]);

// Desktop host requests are not CLI method names. Adapt only verified contracts.
function createHostFetch({ rpc, resolvePath, execFile, gitAvailable, codexHome,
  homeDir, projectRoots, settings, projectlessWorkspaces, hostCapabilities,
  dnsLookup = resolveMx, dnsTimeoutMs = 3000 }) {
  async function cli(method, params) {
    const message = await rpc({ id: `host-fetch-${randomUUID()}`, method, params });
    if (message.error) {
      // Retain upstream details; a failed filesystem operation is not empty data.
      throw Object.assign(new Error(message.error.message), {
        code: "CLI_REQUEST_FAILED", rpcError: message.error
      });
    }
    return message.result;
  }

  async function readJson(filePath, fallback) {
    // Test existence separately because CLI errors do not expose a stable errno.
    try { await cli("fs/getMetadata", { path: filePath }); }
    catch (error) {
      if (/(?:os error 2|os error 3|not found|no such file|cannot find)/i.test(error.message)) return fallback;
      throw error;
    }
    const result = await cli("fs/readFile", { path: filePath });
    if (typeof result?.dataBase64 !== "string") throw new Error("CLI file response is missing dataBase64");
    try { return JSON.parse(Buffer.from(result.dataBase64, "base64").toString("utf8")); }
    catch { return fallback; } // Official readers fall back on malformed JSON.
  }

  async function git(cwd, args) {
    const result = await execFile("git", args, { cwd, timeout: 10000 });
    return result.stdout.trim();
  }

  async function repository(cwd) {
    try { return await git(cwd, ["rev-parse", "--show-toplevel"]); }
    catch (error) {
      // Invalid repositories are normal; permission and executable failures are not.
      if (/not a git repository|cannot change to/i.test(error.stderr || "")) return null;
      throw error;
    }
  }

  async function origins(params) {
    const dirs = params.dirs?.length ? params.dirs : projectRoots();
    if (!Array.isArray(dirs) || dirs.some(dir => typeof dir !== "string")) {
      throw new Error("dirs must be an array of paths");
    }
    if (!await gitAvailable()) return { origins: [], homeDir, available: false };
    const results = [];
    // Deduplicate paths, not repositories: nested workspace roots have separate entries.
    for (const value of new Set(dirs)) {
      const cwd = resolvePath(value, { mustExist: true });
      const root = await repository(cwd);
      if (!root) continue;
      const commonDir = await git(cwd, ["rev-parse", "--path-format=absolute", "--git-common-dir"]);
      let originUrl = null;
      try { originUrl = await git(cwd, ["config", "--get", "remote.origin.url"]) || null; }
      catch (error) { if (error.code !== 1) throw error; } // No remote is a valid local repo.
      results.push({ dir: cwd, root, commonDir, originUrl });
    }
    return { origins: results, homeDir };
  }

  async function shellEnvironment(params) {
    const cwd = resolvePath(params.cwd, { mustExist: true });
    if (!await gitAvailable() || !await repository(cwd)) return { shellEnvironment: null };
    // Git resolves this into the correct per-worktree metadata directory.
    const file = await git(cwd, [
      "rev-parse", "--path-format=absolute", "--git-path", "codex-shell-environment.json"
    ]);
    const value = await readJson(file, null);
    const valid = value?.version === 1 && value.set && typeof value.set === "object" &&
      !Array.isArray(value.set) && Object.values(value.set).every(v => typeof v === "string") &&
      Array.isArray(value.exclude) && value.exclude.every(v => typeof v === "string");
    return { shellEnvironment: valid ? value : null };
  }

  async function keymap() {
    const keymapPath = path.join(codexHome, "keybindings.json");
    const value = await readJson(keymapPath, []);
    const valid = Array.isArray(value) && value.every(binding =>
      binding && typeof binding.command === "string" &&
      (binding.key === null || typeof binding.key === "string"));
    const aliases = {
      closeTabOrWindow: ["closeTab", "closeWindow"], newThread: ["newTask"],
      toggleBrowserPanel: ["stepWorkspaceLayout"],
      toggleSidePanelFullWidth: ["toggleMaximizeSidePanel"]
    };
    // Keep official aliases and let the renderer resolve defaults for absent bindings.
    const bindings = valid ? value.flatMap(binding =>
      (aliases[binding.command] || [binding.command]).map(command => ({
        command, key: binding.key
      }))) : [];
    return { supported: true, keymapPath, bindings,
      primaryNumberShortcutTarget: settings().primaryNumberShortcutTarget };
  }

  async function mailProvider(params) {
    const domain = String(params.domain || "").trim().toLowerCase();
    if (!domain || domain.includes("@")) return { provider: "other" };
    let timer;
    const records = await Promise.race([
      dnsLookup(domain).catch(error => {
        if (["ENODATA", "ENOTFOUND"].includes(error.code)) return [];
        throw error;
      }),
      new Promise(resolve => { timer = setTimeout(() => resolve([]), dnsTimeoutMs); })
    ]).finally(() => clearTimeout(timer));
    // These suffixes are copied from the official MX classifier, not email guesses.
    const matches = suffix => records.some(record => {
      const exchange = record.exchange.trim().toLowerCase();
      return exchange === suffix || exchange.endsWith(`.${suffix}`);
    });
    return { provider: ["google.com", "googlemail.com"].some(matches) ? "google" :
      ["microsoft.com", "microsoftonline.com", "outlook.com", "protection.outlook.com"]
        .some(matches) ? "microsoft" : "other" };
  }

  async function suggestions(params) {
    const empty = { projectRoot: "", generatedAtMs: null, currentSuggestionIds: [], suggestions: [] };
    if (!settings()["ambient-suggestions-enabled"] || !params.projectRoot) return { file: empty };
    const root = resolvePath(params.projectRoot, { mustExist: true });
    const hash = createHash("sha1").update(params.hostId || "local").update("\0").update(root);
    if (params.domain != null) hash.update("\0").update(params.domain);
    // Use the desktop's actual cache; this adapter does not generate model requests.
    const filePath = path.join(codexHome, "ambient-suggestions", hash.digest("hex"),
      "ambient-suggestions.json");
    const file = await readJson(filePath, null);
    const valid = file && (file.generatedAtMs === null || Number.isFinite(file.generatedAtMs)) &&
      Array.isArray(file.currentSuggestionIds) && Array.isArray(file.suggestions);
    return { file: valid ? { ...file, projectRoot: root } : { ...empty, projectRoot: root } };
  }

  return async (name, params = {}) => {
    if (!HOST_FETCH_REQUESTS.has(name)) {
      throw Object.assign(new Error(`Unsupported host request: ${name}`),
        { status: 501, code: "BRIDGE_UNSUPPORTED_REQUEST" });
    }
    // Never route an unknown remote host to the local filesystem or repository.
    if (params.hostId != null && params.hostId !== "local") {
      throw Object.assign(new Error("Remote hosts are not connected in this browser backend"),
        { status: 501, code: "BRIDGE_UNSUPPORTED_HOST" });
    }
    switch (name) {
      case "ensure-directory":
        await cli("fs/createDirectory", {
          path: resolvePath(params.path), recursive: true
        });
        return {}; // Official success envelope, emitted only after CLI completion.
      case "git-origins": return origins(params);
      case "worktree-shell-environment-config": return shellEnvironment(params);
      case "codex-command-keymap-state": return keymap();
      case "email-domain-mail-provider": return mailProvider(params);
      case "ambient-suggestions": return suggestions(params);
      case "wsl-bash-availability": return hostCapabilities.wslBashAvailability();
      case "third-party-notices": return hostCapabilities.thirdPartyNotices();
      // Directory allocation is a desktop policy, not a CLI thread/start RPC.
      case "projectless-thread-cwd": return projectlessWorkspaces.allocate(params);
      case "projectless-workspace-root":
        return { workspaceRoot: await projectlessWorkspaces.workspaceRoot() };
    }
  };
}

module.exports = { createHostFetch, HOST_FETCH_REQUESTS };
