const fs = require("node:fs");
const path = require("node:path");
const { createPrebuiltFrontend } = require("./prebuilt-frontend");
const { BUILD_ASSETS, buildContext } = require("./frontend-assets");

function acceptedEncodings(header, available = ["br", "gzip"]) {
  const weights = new Map();
  // Explicit refusals override wildcards; malformed weights fail closed.
  for (const item of String(header || "").split(",")) {
    const [name, ...parameters] = item.trim().toLowerCase().split(";");
    if (!name) continue;
    const parameter = parameters.map(value => value.trim()).find(value => value.startsWith("q="));
    const value = parameter ? parameter.slice(2) : "1";
    const weight = /^(?:0(?:\.\d{0,3})?|1(?:\.0{0,3})?)$/.test(value) ? Number(value) : 0;
    weights.set(name, weight);
  }
  const identity = weights.get("identity") ?? (weights.get("*") === 0 ? 0 : 1);
  const variants = available.map(name => ({
    name, weight: weights.get(name) ?? weights.get("*") ?? 0
  })).filter(entry => entry.weight > 0).sort((a, b) => b.weight - a.weight);
  // Default to a prepared codec unless identity is explicitly preferred.
  const encoding = variants[0] &&
    !(weights.has("identity") && identity > variants[0].weight) ? variants[0].name : null;
  return { encoding, identityAllowed: identity > 0 };
}

function responseHeaders(headers) {
  const values = String(headers.vary || "").split(",").map(value => value.trim()).filter(Boolean);
  // Proxies must distinguish prepared representations from plain responses.
  if (!values.includes("*") && !values.some(value => value.toLowerCase() === "accept-encoding")) {
    values.push("Accept-Encoding");
  }
  return { ...headers, vary: values.join(", ") };
}

function reject(response, headers, status = 406) {
  if (response.destroyed) return;
  response.writeHead(status, { ...headers, "content-length": 0 });
  response.end();
}

function streamFile(request, response, filename, stat, headers) {
  if (response.destroyed) return true;
  const output = { ...headers, "content-length": stat.size };
  // HEAD advertises GET's representation without opening a file stream.
  if (request.method === "HEAD") {
    response.writeHead(200, output);
    response.end();
    return true;
  }
  let fd;
  // Pin the file before yielding so rebuild cleanup cannot remove a queued read.
  try { fd = fs.openSync(filename, "r"); } catch { return false; }
  const stream = fs.createReadStream(filename, { fd, autoClose: true });
  response.once("close", () => stream.destroy());
  stream.once("error", () => {
    if (response.destroyed) return;
    if (response.headersSent) response.destroy();
    else reject(response, headers, 500);
  });
  response.writeHead(200, output);
  stream.pipe(response);
  return true;
}

function createStaticResponder({ projectRoot, deployment, extensionLoader } = {}) {
  const prepared = projectRoot ? createPrebuiltFrontend(projectRoot) : null;

  function sendPrebuilt(request, response, filename, stat, headers) {
    // Only selected official resources can use prepared output, before adaptation.
    // Most module imports bypass this path without reading extension configuration.
    // Range offsets and no-transform refer to the unencoded representation.
    if (!prepared || !BUILD_ASSETS.includes(path.basename(filename)) ||
        !["GET", "HEAD"].includes(request.method) || request.headers.range ||
        headers["content-encoding"] ||
        String(headers["cache-control"] || "").split(",")
          .some(value => value.trim().toLowerCase() === "no-transform")) return false;
    const files = prepared.lookup(filename, stat, buildContext(deployment, extensionLoader));
    if (!files) return false;
    // Never negotiate an on-disk codec that disappeared or failed validation.
    const accepted = acceptedEncodings(request.headers["accept-encoding"],
      ["br", "gzip"].filter(name => files[name]));
    const output = responseHeaders(headers);
    if (!accepted.encoding && !accepted.identityAllowed) {
      reject(response, output);
      return true;
    }
    const encoding = accepted.encoding;
    if (encoding) output["content-encoding"] = encoding;
    const file = files[encoding || "identity"];
    // Streaming keeps multi-megabyte prepared bundles out of a process-wide cache.
    // If a concurrent rebuild removed the artifact, use the normal plain path.
    return streamFile(request, response, file.filename, file.stat, output);
  }

  function sendBuffer(request, response, content, headers) {
    const output = responseHeaders(headers);
    // All unbuilt resources remain plain; there is no compressor or hash cache.
    // An explicit identity refusal cannot silently receive an unencoded body.
    if (!acceptedEncodings(request.headers["accept-encoding"], []).identityAllowed) {
      reject(response, output);
      return;
    }
    const body = Buffer.isBuffer(content) ? content : Buffer.from(content, "utf8");
    if (response.destroyed) return;
    response.writeHead(200, { ...output, "content-length": body.length });
    response.end(request.method === "HEAD" ? undefined : body);
  }

  function sendFile(request, response, filename, stat, headers) {
    const output = responseHeaders(headers);
    if (!acceptedEncodings(request.headers["accept-encoding"], []).identityAllowed) {
      reject(response, output);
      return;
    }
    // Keep binary and plain assets streamed, rather than copying them into memory.
    if (!streamFile(request, response, filename, stat, output)) reject(response, output, 500);
  }

  return { sendPrebuilt, sendBuffer, sendFile };
}

module.exports = { createStaticResponder, acceptedEncodings };
