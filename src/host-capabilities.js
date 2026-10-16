const fs = require("node:fs/promises");
const path = require("node:path");

// Preserve desktop response contracts without requiring Electron at runtime.
function decodeWindowsOutput(value) {
  if (!Buffer.isBuffer(value)) return String(value ?? "").replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").trim();
  let bytes = value;
  let encoding = "utf8";
  if (bytes[0] === 255 && bytes[1] === 254) {
    bytes = bytes.subarray(2);
    encoding = "utf16le";
  } else {
    // wsl.exe can emit UTF-16 without a BOM even under a non-English locale.
    const pairs = Math.min(Math.floor(bytes.length / 2), 128);
    let zeroes = 0;
    for (let i = 0; i < pairs; i += 1) if (bytes[i * 2 + 1] === 0) zeroes += 1;
    if (pairs && zeroes / pairs > 0.6) encoding = "utf16le";
  }
  return bytes.toString(encoding).replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").trim();
}

function selectDistro(verbose, quiet = "") {
  // These are the official _M/fM rules: marked default, otherwise first Ubuntu.
  const marked = verbose.split("\n").map(line => line.trim()).find(line => line.startsWith("*"));
  return marked?.slice(1).trim().split(/\s+/)[0] ||
    quiet.split("\n").map(line => line.trim()).find(line => /^ubuntu/i.test(line)) || null;
}

function createHostCapabilities({ execFile, projectRoot, platform = process.platform,
  readFile = fs.readFile, onError = () => {} }) {
  let distroPromise;
  async function wslOutput(args) {
    const result = await execFile("wsl.exe", args, {
      timeout: 3000, windowsHide: true, encoding: "buffer", maxBuffer: 10240
    });
    return decodeWindowsOutput(result.stdout);
  }
  async function findDistro() {
    try {
      await wslOutput(["--status"]);
      const verbose = await wslOutput(["--list", "--verbose"]);
      const marked = selectDistro(verbose);
      return marked || selectDistro("", await wslOutput(["--list", "--quiet"]));
    } catch (error) {
      // The desktop also reports unavailable for a missing or failed WSL install.
      onError("wsl-bash-availability", error);
      return null;
    }
  }
  async function wslBashAvailability() {
    if (platform !== "win32") return { available: false, distro: null };
    // Share the official cached distro selection across concurrent settings queries.
    distroPromise ??= findDistro();
    const distro = await distroPromise;
    if (!distro) return { available: false, distro: null };
    try {
      await execFile("wsl.exe", ["-d", distro, "--", "/usr/bin/bash", "-lc", "exit 0"], {
        timeout: 30000, windowsHide: true, encoding: "utf8", maxBuffer: 10240
      });
      return { available: true, distro };
    } catch (error) {
      onError("wsl-bash-availability", error);
      return { available: false, distro };
    }
  }
  async function thirdPartyNotices() {
    const sources = [
      ["Codex desktop 26.1007.2314 official notices", "docs/licenses/codex-desktop-26.1007.2314.NOTICES.txt"],
      ["Bundled Node.js", "runtime/node/LICENSE"],
      ["smol-toml", "node_modules/smol-toml/LICENSE"],
      ["LibreChat attachment reference", "docs/licenses/LibreChat-MIT.txt"],
      ["Packaged emoji data", "runtime/codex-frontend-26.917.9434/webview/licenses/emoji-datasource.LICENSE"]
    ];
    const sections = [];
    for (const [title, relative] of sources) {
      try {
        const text = await readFile(path.join(projectRoot, relative), "utf8");
        if (text.trim()) sections.push(`${title}\n${"=".repeat(title.length)}\n${text}`);
      } catch (error) {
        // Only a genuinely absent file is a legitimate missing-notices result.
        if (error.code !== "ENOENT") throw error;
      }
    }
    return { text: sections.length ? sections.join("\n\n") : null };
  }
  return { wslBashAvailability, thirdPartyNotices };
}

module.exports = { createHostCapabilities, decodeWindowsOutput, selectDistro };
