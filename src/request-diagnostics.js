const fs = require("node:fs");
const path = require("node:path");
const { randomUUID } = require("node:crypto");
const diagnostics = require("./bridge-diagnostics");

// Backend-owned errors survive closed pages and lost browser telemetry batches.
function createRequestDiagnostics({ directory, onError = () => {}, maxBytes = 10 * 1024 * 1024 }) {
  const filename = path.join(directory, "bridge-request-errors.jsonl");
  const recent = [];
  function record({ kind, key, error, traceId, status, durationMs, expected = false }) {
    const entry = {
      at: Date.now(), kind: diagnostics.redact(kind, 80), key: diagnostics.redact(key, 180),
      traceId: diagnostics.traceId(traceId) || `backend-${randomUUID()}`,
      status, expected: Boolean(expected), error: diagnostics.summarize(error),
      durationMs: Number.isFinite(durationMs) ? Math.max(0, Math.round(durationMs)) : undefined
    };
    recent.push(entry);
    if (recent.length > 100) recent.shift();
    try {
      fs.mkdirSync(directory, { recursive: true });
      // Rotate only this logger's own file; never delete shared runtime/PID files.
      if (fs.existsSync(filename) && fs.statSync(filename).size >= maxBytes) {
        fs.rmSync(`${filename}.1`, { force: true });
        fs.renameSync(filename, `${filename}.1`);
      }
      fs.appendFileSync(filename, `${JSON.stringify(entry)}\n`);
    } catch (error) { onError(error); }
    return entry;
  }
  return { record, snapshot: () => ({ logPath: filename, recent: [...recent] }) };
}

module.exports = { createRequestDiagnostics };
