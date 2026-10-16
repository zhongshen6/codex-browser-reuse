// Git is a system-provided optional capability, never a project download.
function createOptionalGit(execFileAsync) {
  let pending;
  let state = { checked: false, available: false, version: null };
  const check = () => pending ||= execFileAsync("git", ["--version"], { timeout: 5000 })
    .then(({ stdout }) => {
      // A successful non-Git executable must not enable repository operations.
      const version = String(stdout).trim();
      state = { checked: true, available: /^git version \S+/.test(version), version };
      return state;
    }, () => {
      state = { checked: true, available: false, version: null };
      return state;
    });
  return { check, status: () => ({ ...state }) };
}

function unavailableGitResult(method, params = {}, cwd) {
  // Read-only discovery stays usable; mutation/review must not pretend to succeed.
  const unavailable = { available: false };
  switch (method) {
    case "availability": return unavailable;
    case "config-value": return { ...unavailable, value: null };
    case "watch-repo":
    case "unwatch-repo":
    case "invalidate-git-read-caches": return { ...unavailable, ok: true };
    case "status-summary":
      return { ...unavailable, cwd, branch: null, files: [], isClean: true };
    case "stable-metadata":
      return { ...unavailable, cwd, root: null, commonDir: null, branch: null, isDirty: false };
    case "current-branch":
    case "default-branch":
    case "base-branch": return { ...unavailable, branch: null };
    case "recent-branches": return { ...unavailable, branches: [] };
    case "branch-exists":
      return { ...unavailable, exists: false, branch: String(params.branch || params.name || "") };
    case "branch-commits": return { ...unavailable, commits: [] };
    default:
      // No empty diff or successful branch creation is fabricated when Git is absent.
      throw Object.assign(new Error("System Git is unavailable. Git features are disabled."),
        { code: "GIT_UNAVAILABLE" });
  }
}

module.exports = { createOptionalGit, unavailableGitResult };
