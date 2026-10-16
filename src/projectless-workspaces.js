const fs = require("node:fs/promises");
const { constants } = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { randomUUID } = require("node:crypto");

// Port of yt/Ct/Et in the official 26.1007.2314 desktop host. Keep naming,
// date grouping, collision handling and split-directory semantics together.
function projectlessDirectoryName({ directoryName, prompt } = {}) {
  // Explicit names are not truncated to six words; both sources have an 80-byte
  // ASCII limit after extraction, so separators cannot create nested paths.
  const words = (directoryName ?? prompt)?.toLowerCase().match(/[a-z0-9]+/g);
  if (!words?.length) return "new-chat";
  return (directoryName == null ? words.slice(0, 6) : words).join("-").slice(0, 80);
}

function projectlessDateDirectory(date) {
  // Use the execution host's local calendar, just like the desktop app.
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function createProjectlessWorkspaces({ settings, homeDirectory = os.homedir(),
  fileSystem = fs, now = () => new Date(), uniqueSuffix = randomUUID }) {
  const allocated = new Map();
  // Retain only allocations made by this host; existing user directories are
  // not treated as projectless merely because their names resemble this layout.
  const pathKey = value => process.platform === "win32"
    ? path.normalize(value).toLowerCase() : path.normalize(value);

  function root() {
    const configured = settings().projectlessWorkspaceRoot;
    const value = configured ?? path.join(homeDirectory, "Documents", "Codex");
    // Do not turn relative config into a path relative to the backend program.
    if (typeof value !== "string" || !path.isAbsolute(value)) {
      throw new Error("Projectless chat folder must be absolute on the execution host");
    }
    return value;
  }

  async function realDirectory(value) {
    // lstat checks the entry itself, preventing a date-folder junction escape.
    const metadata = await fileSystem.lstat(value);
    if (!metadata.isDirectory() || metadata.isSymbolicLink()) {
      throw new Error("Projectless thread directory must be a real directory");
    }
  }

  async function workspaceRoot({ createIfMissing = false } = {}) {
    const value = root();
    if (createIfMissing) await fileSystem.mkdir(value, { recursive: true });
    try { await realDirectory(value); }
    catch (error) {
      // Querying the default before the first chat does not create a workspace.
      if (!createIfMissing && error.code === "ENOENT") return value;
      throw error;
    }
    const resolved = await fileSystem.realpath(value);
    await realDirectory(resolved);
    return resolved;
  }

  async function allocate({ hostId, createSplitDirectories = true,
    directoryName = null, prompt = null } = {}) {
    // Unknown hosts must never silently allocate directories on this machine.
    if (hostId != null && hostId !== "local") {
      throw Object.assign(new Error("Remote hosts are not connected in this browser backend"),
        { status: 501, code: "BRIDGE_UNSUPPORTED_HOST" });
    }
    if ((directoryName !== null && typeof directoryName !== "string") ||
        (prompt !== null && typeof prompt !== "string")) {
      throw new Error("directoryName and prompt must be strings or null");
    }
    const base = await workspaceRoot({ createIfMissing: true });
    const dateDirectory = path.join(base, projectlessDateDirectory(now()));
    await fileSystem.mkdir(dateDirectory, { recursive: true });
    await realDirectory(dateDirectory);
    const name = projectlessDirectoryName({ directoryName, prompt });

    async function attempt(threadDirectoryName) {
      const cwd = path.join(dateDirectory, threadDirectoryName);
      try { await fileSystem.mkdir(cwd, { recursive: false }); }
      catch (error) {
        // Exclusive mkdir makes concurrent requests choose distinct directories.
        if (error.code !== "EEXIST") throw error;
        return null;
      }
      let outputDirectory = cwd;
      if (createSplitDirectories !== false) {
        try {
          await Promise.all([
            fileSystem.mkdir(path.join(cwd, "outputs"), { recursive: false }),
            fileSystem.mkdir(path.join(cwd, "work"), { recursive: false })
          ]);
          outputDirectory = path.join(cwd, "outputs");
        } catch {
          // Official host still returns the chat directory if the split fails.
          outputDirectory = cwd;
        }
      }
      const result = { cwd, outputDirectory, workspaceRoot: base };
      // cwd stays at the chat root even when work and outputs exist below it.
      allocated.set(pathKey(cwd), result);
      return result;
    }

    for (let index = 0; index < 100; index += 1) {
      const result = await attempt(index === 0 ? name : `${name}-${index + 1}`);
      if (result) return result;
    }
    // The official numeric range is bounded; use a unique suffix after it fills.
    for (let index = 0; index < 5; index += 1) {
      const result = await attempt(`${name}-${uniqueSuffix()}`);
      if (result) return result;
    }
    throw new Error("Unable to create a unique projectless thread directory");
  }

  async function resolveSelectedDirectory(value) {
    if (typeof value !== "string" || !path.isAbsolute(value)) {
      throw new Error("Projectless chat folder must be an absolute local path");
    }
    // The native picker returns the resolved, accessible directory, not an alias.
    const resolved = await fileSystem.realpath(value);
    await realDirectory(resolved);
    await Promise.all([constants.R_OK, constants.W_OK, constants.X_OK]
      .map(mode => fileSystem.access(resolved, mode)));
    return resolved;
  }

  return { root, workspaceRoot, allocate, resolveSelectedDirectory,
    pathsForCwd: cwd => typeof cwd === "string" ? allocated.get(pathKey(cwd)) : undefined };
}

module.exports = { createProjectlessWorkspaces, projectlessDirectoryName,
  projectlessDateDirectory };
