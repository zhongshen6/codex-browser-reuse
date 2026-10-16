const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const http = require("node:http");
const https = require("node:https");
const zlib = require("node:zlib");
const { parse } = require("smol-toml");
const { createHash } = require("node:crypto");

// Capture only model tool declarations; never persist prompts, headers or credentials.
function snapshot(body, route) {
  return {
    at: new Date().toISOString(), route, model: body.model,
    tools: body.tools || [], toolChoice: body.tool_choice ?? null,
    parallelToolCalls: body.parallel_tool_calls ?? null,
    // Discovery results carry deferred schemas in input, outside the top-level tools.
    discoveries: (Array.isArray(body.input) ? body.input : [])
      .filter(item => item.type === "tool_search_output")
      .map(item => ({ fields: Object.keys(item), tools: item.tools || item.output?.tools || [] }))
  };
}

// Sort object keys, but retain array order because schema arrays can be meaningful.
function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]));
}

function summarize(record) {
  return (record.tools || []).map(tool => ({
    name: `${tool.type}:${tool.name || tool.function?.name || ""}`,
    hash: createHash("sha256").update(JSON.stringify(stable(tool))).digest("hex"),
    // Namespace tools can wrap several actual functions; report them separately.
    members: (tool.tools || []).map(member => member.name || member.function?.name)
  }));
}

async function serve(port, directory) {
  const home = process.env.CODEX_HOME || path.join(os.homedir(), ".codex");
  const config = parse(fs.readFileSync(path.join(home, "config.toml"), "utf8"));
  const provider = config.model_providers?.[config.model_provider];
  if (!provider?.base_url) throw new Error("A configured provider base_url is required");
  const upstream = new URL(provider.base_url.replace(/\/$/, "") + "/");
  fs.mkdirSync(directory, { recursive: true });
  const file = path.join(directory, "requests.jsonl");
  // Refuse reuse so earlier captures cannot be mistaken for this experiment.
  fs.writeFileSync(file, "", { flag: "wx" });
  const server = http.createServer(async (request, response) => {
    // Keep diagnostic controls on loopback and never alter the running app server.
    if (request.url === "/__finish" && request.method === "POST") {
      response.end("stopped");
      server.close();
      server.closeIdleConnections();
      return;
    }
    if (request.url === "/__status") {
      response.setHeader("content-type", "application/json");
      response.end(JSON.stringify({
        pid: process.pid, provider: config.model_provider, model: config.model,
        records: fs.readFileSync(file, "utf8").trim().split("\n").filter(Boolean).length
      }));
      return;
    }
    const match = /^\/(browser|terminal)\/v1\/(.*)$/.exec(request.url || "");
    if (!match) { response.writeHead(404).end(); return; }
    try {
      const chunks = [];
      let bytes = 0;
      for await (const chunk of request) {
        // Bound request buffering while allowing normal tool and prompt payloads.
        bytes += chunk.length;
        if (bytes > 32 * 1024 * 1024) throw new Error("probe payload limit");
        chunks.push(chunk);
      }
      const raw = Buffer.concat(chunks);
      let decoded = raw;
      const encoding = request.headers["content-encoding"];
      if (encoding === "gzip") decoded = zlib.gunzipSync(raw);
      else if (encoding === "zstd") decoded = zlib.zstdDecompressSync(raw);
      else if (encoding && encoding !== "identity") throw new Error("unknown encoding");
      if (match[2].split("?")[0] === "responses") {
        const record = snapshot(JSON.parse(decoded.toString("utf8")), match[1]);
        fs.appendFileSync(file, JSON.stringify(record) + "\n");
        console.log(JSON.stringify({ route: match[1], model: record.model,
          tools: summarize(record) }));
      }
      const target = new URL(match[2], upstream);
      // Diagnostics may forward only to the configured provider, never arbitrary origins.
      if (target.origin !== upstream.origin) throw new Error("unexpected upstream origin");
      // Preserve transport bytes and existing authentication; no credential is logged.
      const headers = { ...request.headers, host: target.host };
      delete headers.connection;
      const send = target.protocol === "https:" ? https.request : http.request;
      const forwarded = send(target, { method: request.method, headers }, upstreamResponse => {
        response.writeHead(upstreamResponse.statusCode, upstreamResponse.headers);
        // Stream SSE unchanged rather than buffering model responses.
        upstreamResponse.pipe(response);
        upstreamResponse.on("error", () => response.destroy());
      });
      forwarded.on("error", () => {
        if (!response.headersSent) response.writeHead(502);
        response.end("probe upstream transport failure");
      });
      forwarded.end(raw);
    } catch (error) {
      // Error categories are safe; avoid reflecting request or upstream content.
      console.error("probe capture failed:", error.code || error.name);
      if (!response.headersSent) response.writeHead(400);
      response.end("probe capture failure");
    }
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", resolve);
  });
  console.log(JSON.stringify({ listening: port, directory }));
  // Limit a forgotten diagnostic listener's lifetime without changing global config.
  const expiry = setTimeout(() => {
    server.closeAllConnections();
    server.close();
  }, 15 * 60 * 1000);
  server.once("close", () => clearTimeout(expiry));
}

function compare(file) {
  const records = fs.readFileSync(file, "utf8").trim().split("\n").filter(Boolean).map(JSON.parse);
  const first = route => records.find(record => record.route === route);
  const last = route => records.filter(record => record.route === route).at(-1);
  if (!first("browser") || !first("terminal")) throw new Error("Both captures are required");
  const difference = (browser, terminal) => {
    const b = new Map(browser.map(tool => [tool.name, tool]));
    const t = new Map(terminal.map(tool => [tool.name, tool]));
    return {
      browserOnly: browser.filter(tool => !t.has(tool.name)),
      terminalOnly: terminal.filter(tool => !b.has(tool.name)),
      differentDefinitions: browser.filter(tool => t.has(tool.name) && t.get(tool.name).hash !== tool.hash)
    };
  };
  const discoveries = route => {
    const schemas = new Map();
    for (const record of records.filter(record => record.route === route)) {
      for (const discovery of record.discoveries || []) {
        for (const tool of discovery.tools) {
          // Search returns partial namespaces; compare members, not the last namespace fragment.
          if (tool.type === "namespace" && Array.isArray(tool.tools)) {
            for (const member of tool.tools) {
              const [entry] = summarize({ tools: [{ ...tool, tools: [member] }] });
              entry.name += "." + member.name;
              schemas.set(entry.name, entry);
            }
          } else {
            const [entry] = summarize({ tools: [tool] });
            schemas.set(entry.name, entry);
          }
        }
      }
    }
    return [...schemas.values()];
  };
  const browser = summarize(last("browser"));
  const terminal = summarize(last("terminal"));
  const deferredBrowser = discoveries("browser");
  const deferredTerminal = discoveries("terminal");
  return {
    records: records.map(record => ({ route: record.route, at: record.at, model: record.model,
      count: record.tools.length })),
    browser, terminal,
    ...difference(browser, terminal),
    // Distinguish a cold-start catalog from the final observed catalog.
    initial: difference(summarize(first("browser")), summarize(first("terminal"))),
    deferred: { browser: deferredBrowser, terminal: deferredTerminal,
      ...difference(deferredBrowser, deferredTerminal) },
    // Selection policy is outside tool schemas and must be compared independently.
    policies: ["toolChoice", "parallelToolCalls"].map(key => ({
      key, browser: last("browser")[key], terminal: last("terminal")[key]
    }))
  };
}

if (require.main === module) {
  const [command, ...args] = process.argv.slice(2);
  if (command === "serve") serve(Number(args[0]), path.resolve(args[1])).catch(error => {
    console.error(error.code || error.message);
    process.exitCode = 1;
  });
  else if (command === "compare") console.log(JSON.stringify(compare(args[0]), null, 2));
  else { console.error("Usage: tool-catalog-probe.js serve PORT DIRECTORY | compare FILE"); process.exitCode = 1; }
}

module.exports = { snapshot, summarize, compare };
