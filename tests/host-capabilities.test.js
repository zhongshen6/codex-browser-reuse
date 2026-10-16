const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { createHostCapabilities, decodeWindowsOutput, selectDistro } = require("../src/host-capabilities");

test("desktop WSL parsing follows the marked distro and Ubuntu fallback", () => {
  const verbose = "  NAME            STATE           VERSION\n* Debian          Running         2\n  Ubuntu          Stopped         2";
  assert.equal(selectDistro(verbose), "Debian");
  assert.equal(selectDistro("NAME STATE VERSION\n  Ubuntu Running 2", "Ubuntu\nDebian"), "Ubuntu");
  assert.equal(decodeWindowsOutput(Buffer.from([255, 254, 68, 0, 10, 0])), "D");
});

test("WSL capability returns the official response envelope", async () => {
  const calls = [];
  const capabilities = createHostCapabilities({
    platform: "win32",
    projectRoot: process.cwd(),
    execFile: async (file, args) => {
      calls.push([file, args]);
      if (args[0] === "--status") return { stdout: "Default Distribution: Debian" };
      if (args[0] === "--list") return { stdout: "* Debian Running 2\n  Ubuntu Stopped 2" };
      return { stdout: "" };
    }
  });
  assert.deepEqual(await capabilities.wslBashAvailability(), { available: true, distro: "Debian" });
  assert.equal(calls.filter(([file]) => file === "wsl.exe").length, 3);
});

test("missing WSL and third-party notices remain explicit", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "codex-capabilities-"));
  try {
    const capabilities = createHostCapabilities({
      platform: "win32", projectRoot: root,
      execFile: async () => { throw Object.assign(new Error("not found"), { code: "ENOENT" }); }
    });
    assert.deepEqual(await capabilities.wslBashAvailability(), { available: false, distro: null });
    assert.deepEqual(await capabilities.thirdPartyNotices(), { text: null });
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
