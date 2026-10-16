const fs = require("node:fs");
const path = require("node:path");
const { randomUUID } = require("node:crypto");

const THREAD_PROJECT_STATE_KEYS = {
  threadAssignments: "thread-project-assignments",
  projectlessThreadIds: "projectless-thread-ids",
  threadWorkspaceRootHints: "thread-workspace-root-hints",
  threadProjectlessOutputDirectories: "thread-projectless-output-directories"
};

// These are the desktop's existing state fields, not a second browser-owned
// project database. Every mutation rereads the file to preserve unrelated keys.
function createThreadProjectState({ filePath }) {
  const removedThreadIds = new Set();
  // Official delayed-write protection lasts for the current host lifetime.
  // Disk metadata, unlike these tombstones, must survive backend restarts.
  function document() {
    try {
      const value = JSON.parse(fs.readFileSync(filePath, "utf8"));
      if (!value || typeof value !== "object" || Array.isArray(value)) {
        throw new Error("Invalid Codex global state");
      }
      return value;
    } catch (error) {
      if (error.code === "ENOENT") return {};
      throw error; // Never replace a corrupt or unreadable file with empty state.
    }
  }

  function snapshot(state) {
    // Readers and the HTML bootstrap share exactly the same field names.
    return Object.fromEntries(Object.entries(THREAD_PROJECT_STATE_KEYS).map(([name, key]) =>
      [name, state[key] ?? (name === "projectlessThreadIds" ? [] : {})]));
  }

  function mutate(change) {
    const state = document();
    // Synchronous read-change-replace keeps requests in this process serialized.
    // The reread also incorporates edits made by other clients before this call.
    change(state);
    const temporary = `${filePath}.${randomUUID()}.tmp`;
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    try {
      fs.writeFileSync(temporary, JSON.stringify(state), { encoding: "utf8", flag: "wx" });
      fs.renameSync(temporary, filePath);
    } finally {
      // Only our own temporary file is removed, never workspace or session data.
      if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
    }
    return snapshot(state);
  }

  function requireThreadId(value) {
    // Keys are opaque CLI thread IDs; never derive ownership from cwd here.
    if (typeof value !== "string" || !value.trim()) throw new Error("threadId is required");
  }

  function pathHint(state, key, threadId, value) {
    // Undefined preserves a hint; null removes it. These meanings are distinct
    // in the official combined membership/path update service.
    if (value === undefined) return;
    if (value !== null && (typeof value !== "string" || !path.isAbsolute(value))) {
      throw new Error(`${key} must contain an absolute path`);
    }
    const hints = { ...state[key] };
    if (value === null) delete hints[threadId];
    else hints[threadId] = value;
    state[key] = hints;
  }

  function updateProjectlessThread({ threadId, projectless, workspaceRoot, outputDirectory } = {}) {
    requireThreadId(threadId);
    if (projectless !== undefined && typeof projectless !== "boolean") {
      throw new Error("projectless must be a boolean");
    }
    // Match the official service's tombstone: delayed hint writes must not
    // resurrect a removed conversation's output directory or root mapping.
    const removing = projectless === false && outputDirectory == null;
    if (!removing && removedThreadIds.has(threadId)) return snapshot(document());
    const result = mutate(state => {
      // Partial hint writes must not implicitly change project membership.
      if (projectless !== undefined) {
        const ids = new Set(state["projectless-thread-ids"] ?? []);
        if (projectless) ids.add(threadId);
        else ids.delete(threadId);
        state["projectless-thread-ids"] = [...ids];
        if (projectless) {
          const assignments = { ...state["thread-project-assignments"] };
          delete assignments[threadId];
          state["thread-project-assignments"] = assignments;
        }
      }
      pathHint(state, "thread-workspace-root-hints", threadId, removing ? null : workspaceRoot);
      pathHint(state, "thread-projectless-output-directories", threadId, outputDirectory);
    });
    if (removing) removedThreadIds.add(threadId);
    return result;
  }

  function setAssignments(entries) {
    // Validate the entire restore batch before changing any membership.
    for (const { threadId, assignment } of entries) {
      requireThreadId(threadId);
      if (assignment != null && (typeof assignment !== "object" ||
          typeof assignment.projectId !== "string" || !assignment.projectId)) {
        throw new Error("assignment must contain a projectId");
      }
    }
    return mutate(state => {
      const assignments = { ...state["thread-project-assignments"] };
      const ids = new Set(state["projectless-thread-ids"] ?? []);
      for (const { threadId, assignment } of entries) {
        if (assignment == null) delete assignments[threadId];
        else {
          assignments[threadId] = assignment;
          ids.delete(threadId);
        }
      }
      state["thread-project-assignments"] = assignments;
      state["projectless-thread-ids"] = [...ids];
    });
  }

  function setGlobalState(key, value) {
    // Generic global-state writes are limited to the four verified ownership keys.
    if (!Object.values(THREAD_PROJECT_STATE_KEYS).includes(key)) {
      throw new Error("Unsupported thread project state key");
    }
    if (key === "projectless-thread-ids") {
      if (!Array.isArray(value) || value.some(id => typeof id !== "string" || !id)) {
        throw new Error("projectless-thread-ids must be a list of thread IDs");
      }
    } else if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error("Thread project state must be a record");
    } else if (key !== "thread-project-assignments" &&
        Object.values(value).some(hint => typeof hint !== "string" || !path.isAbsolute(hint))) {
      throw new Error("Thread path hints must be absolute paths");
    }
    return mutate(state => { state[key] = value; });
  }

  return { read: () => snapshot(document()), updateProjectlessThread, setAssignments,
    setGlobalState };
}

module.exports = { createThreadProjectState, THREAD_PROJECT_STATE_KEYS };
