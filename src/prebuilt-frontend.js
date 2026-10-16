const fs = require("node:fs");
const path = require("node:path");
const { BUILD_INPUTS, FRONTEND_ROOT } = require("./frontend-assets");

const BUILD_DIRECTORY = "runtime/frontend-build";

function fileStamp(filename) {
  const stat = fs.statSync(filename);
  if (!stat.isFile()) throw new Error(`Not a regular file: ${filename}`);
  // Metadata checks avoid hashing megabytes of JavaScript on every request.
  return { size: stat.size, mtimeMs: stat.mtimeMs };
}

function sameStamp(left, right) {
  return left?.size === right?.size && left?.mtimeMs === right?.mtimeMs;
}

function createPrebuiltFrontend(projectRoot) {
  const directory = path.join(projectRoot, BUILD_DIRECTORY);
  const manifestPath = path.join(directory, "manifest.json");
  let lastStamp;
  let manifest;

  function lookup(filename, sourceStat, context) {
    try {
      const stamp = fileStamp(manifestPath);
      // A manual rebuild becomes visible without restarting the HTTP process.
      if (!sameStamp(stamp, lastStamp)) {
        manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
        lastStamp = stamp;
      }
      if (manifest.format !== 1 || JSON.stringify(manifest.context) !== JSON.stringify(context)) return null;
      // Relative identities allow moving the complete project directory.
      const relative = path.relative(projectRoot, filename).split(path.sep).join("/");
      if (!relative.startsWith(`${FRONTEND_ROOT}/assets/`)) return null;
      const entry = manifest.assets[relative];
      if (!entry || !sameStamp(entry.input, sourceStat)) return null;
      // Adapter changes affect output even when the official asset is unchanged.
      // A mismatch always returns control to current-byte adaptation.
      for (const input of BUILD_INPUTS) {
        if (!sameStamp(manifest.inputs[input], fileStamp(path.join(projectRoot, input)))) return null;
      }
      const files = {};
      // Missing compressed variants are negotiable; missing plain output is not.
      for (const [encoding, artifact] of Object.entries(entry.files)) {
        // The manifest cannot escape its output directory or expose arbitrary files.
        if (!["identity", "gzip", "br"].includes(encoding) ||
            !/^[a-f0-9]{64}\.(?:raw|gz|br)$/.test(artifact.name)) return null;
        const output = path.join(directory, artifact.name);
        try {
          const stat = fs.statSync(output);
          if (stat.isFile() && stat.size === artifact.size) files[encoding] = { filename: output, stat };
        } catch {}
      }
      return files.identity ? files : null;
    } catch {
      // Missing, invalid or stale builds never trigger runtime compression.
      return null;
    }
  }

  return { lookup };
}

module.exports = { BUILD_DIRECTORY, fileStamp, sameStamp, createPrebuiltFrontend };
