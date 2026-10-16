const fs = require("node:fs/promises");
const path = require("node:path");
const { randomUUID } = require("node:crypto");

const toolFields = ["name", "namespace", "description", "inputSchema", "deferLoading"];

function describeDynamicTools(request) {
  const params = request?.params;
  // Absence must stay distinct from an empty list when diagnosing resumed threads.
  if (!params || !Object.hasOwn(params, "dynamicTools")) return { state: "absent" };
  const tools = params.dynamicTools;
  if (tools === null) return { state: "null" };
  if (!Array.isArray(tools)) return { state: "invalid", valueType: typeof tools };
  return {
    state: tools.length ? "provided" : "empty",
    count: tools.length,
    // Only tool definitions are recorded, never surrounding messages or configuration.
    tools: tools.map(tool => {
      if (!tool || typeof tool !== "object" || Array.isArray(tool)) {
        return { invalid: true, valueType: tool === null ? "null" : typeof tool };
      }
      const definition = Object.fromEntries(toolFields
        .filter(key => Object.hasOwn(tool, key)).map(key => [key, tool[key]]));
      return { ...definition, declaredFields: Object.keys(tool) };
    })
  };
}

function createToolRegistrationLog({
  directory, maxBytes = 10 * 1024 * 1024, onError = () => {}, now = Date.now
}) {
  const file = path.join(directory, "tool-registrations.jsonl");
  let writes = Promise.resolve();

  function record(entry) {
    // Serialize immediately so later request adaptation cannot change the snapshot.
    let line;
    try {
      // Wall-clock time and PID distinguish captures made before and after a restart.
      line = JSON.stringify({ at: new Date(now()).toISOString(), pid: process.pid, ...entry }) + "\n";
    } catch (error) {
      // Error reporting itself must also remain observational rather than blocking RPCs.
      try { onError(error); } catch {}
      return;
    }
    // Ordered asynchronous writes keep filesystem work out of the RPC hot path.
    writes = writes.then(async () => {
      await fs.mkdir(directory, { recursive: true });
      const size = await fs.stat(file).then(stat => stat.size).catch(error => {
        if (error.code === "ENOENT") return 0;
        throw error;
      });
      // Retain one previous segment; rare oversized definitions stay complete.
      if (size && size + Buffer.byteLength(line) > maxBytes) {
        await fs.rm(file + ".1", { force: true });
        await fs.rename(file, file + ".1");
      }
      await fs.appendFile(file, line, "utf8");
    }).catch(error => {
      // Audit failures must not fail a user's conversation or leave a rejected queue.
      try { onError(error); } catch {}
    });
  }

  function begin(request, { source = "backend" } = {}) {
    const method = request?.method;
    // Capture starts/resumes even without tools, otherwise silence would be ambiguous.
    if (!["thread/start", "thread/resume"].includes(method) &&
        !Object.hasOwn(request?.params || {}, "dynamicTools")) return null;
    const trace = {
      traceId: randomUUID(), source, method,
      requestId: request.id ?? null,
      threadId: typeof request.params?.threadId === "string" ? request.params.threadId : null
    };
    record({ ...trace, event: "received", dynamicTools: describeDynamicTools(request) });
    let finished = false;
    return {
      submitted(adaptedRequest) {
        record({ ...trace, event: "cli-submitted",
          dynamicTools: describeDynamicTools(adaptedRequest) });
      },
      responded(message) {
        if (finished) return;
        finished = true;
        const threadId = message?.result?.thread?.id || trace.threadId;
        // Successful RPC means accepted request, not proof of the model's final tool list.
        record({ ...trace, threadId, event: "cli-response",
          outcome: message?.error ? "request-rejected" : "request-succeeded",
          errorCode: Number.isInteger(message?.error?.code) ? message.error.code : null });
      },
      failed(reason) {
        if (finished) return;
        finished = true;
        // Do not copy error text: providers can echo sensitive request values in it.
        record({ ...trace, event: "bridge-failure", reason });
      }
    };
  }

  return { begin, flush: () => writes, file };
}

module.exports = { createToolRegistrationLog, describeDynamicTools };
