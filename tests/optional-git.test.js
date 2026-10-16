const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createOptionalGit, unavailableGitResult } = require("../src/optional-git");

test("system Git is probed once even during concurrent sidebar requests", async () => {
  let calls = 0;
  // Concurrent renders share one pending check instead of launching many processes.
  const git = createOptionalGit(async (file, args, options) => {
    calls++;
    assert.equal(file, "git");
    assert.deepEqual(args, ["--version"]);
    assert.equal(options.timeout, 5000);
    return { stdout: "git version 2.50.0.windows.1\n" };
  });
  const results = await Promise.all([git.check(), git.check(), git.check()]);
  assert.equal(calls, 1);
  assert.ok(results.every(state => state.available && state.checked));
});

test("missing system Git disables discovery without affecting other services", async () => {
  // Simulate PATH without Git; tests never uninstall or alter the user's software.
  const git = createOptionalGit(async () => { throw Object.assign(new Error("missing"), { code: "ENOENT" }); });
  assert.deepEqual(await git.check(), { checked: true, available: false, version: null });
  assert.deepEqual(unavailableGitResult("availability"), { available: false });
  assert.deepEqual(unavailableGitResult("recent-branches"), { available: false, branches: [] });
  assert.equal(unavailableGitResult("stable-metadata", {}, "C:\\workspace").root, null);
  assert.equal(unavailableGitResult("status-summary", {}, "C:\\workspace").available, false);
  assert.equal(unavailableGitResult("config-value").value, null);
  assert.equal(unavailableGitResult("current-branch").branch, null);
});

test("a missing Git does not fabricate mutations or empty review results", () => {
  // A disabled write/review must be explicit, not a misleading successful empty result.
  for (const method of ["create-branch", "review-diff", "branch-diff-stats"]) {
    assert.throws(() => unavailableGitResult(method), { code: "GIT_UNAVAILABLE" });
  }
});
