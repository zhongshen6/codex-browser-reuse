const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const http = require("node:http");
const zlib = require("node:zlib");
const { createHash, randomUUID } = require("node:crypto");
const { performance } = require("node:perf_hooks");

const projectRoot = path.resolve(__dirname, "..");
const directory = path.join(projectRoot, "runtime/frontend-build");
const reportPath = path.join(projectRoot, "logs/decompression-measurements.json");
// Use the already-built local variants; measuring never rebuilds or changes them.
const manifest = JSON.parse(fs.readFileSync(path.join(directory, "manifest.json"), "utf8"));
// Load every variant before timing so filesystem reads cannot inflate decoder cost.
const assets = Object.entries(manifest.assets).map(([name, entry]) => ({
  name: path.basename(name),
  data: Object.fromEntries(Object.entries(entry.files).map(([encoding, artifact]) =>
    [encoding, fs.readFileSync(path.join(directory, artifact.name))]))
}));

function statistics(values) {
  // Nearest-rank percentiles retain outliers rather than averaging them away.
  const sorted = [...values].sort((a, b) => a - b);
  const pick = percentile => sorted[Math.max(0, Math.ceil(sorted.length * percentile) - 1)];
  const round = value => Number(value.toFixed(3));
  return { medianMs: round(pick(0.5)), p95Ms: round(pick(0.95)), minMs: round(sorted[0]), maxMs: round(sorted.at(-1)) };
}

function measureNode(rounds = 30) {
  const measurements = Object.fromEntries(["gzip", "br"].map(codec => [
    codec, { totals: [], perAsset: assets.map(() => []), cpu: [] }
  ]));
  // Decode once and compare actual bytes before collecting performance samples.
  for (const asset of assets) {
    for (const codec of ["gzip", "br"]) {
      const decoded = codec === "gzip" ? zlib.gunzipSync(asset.data[codec]) : zlib.brotliDecompressSync(asset.data[codec]);
      if (!decoded.equals(asset.data.identity)) throw new Error(`Incorrect decoded bytes: ${asset.name}`);
    }
  }
  // Alternate codec order to avoid systematically favoring one with warm caches.
  for (let round = -3; round < rounds; round++) {
    for (const codec of round % 2 ? ["gzip", "br"] : ["br", "gzip"]) {
      const timings = [];
      const beforeCpu = process.cpuUsage();
      // Process CPU includes GC/helper threads, not just one decoder's CPU time.
      const totalStart = performance.now();
      for (const asset of assets) {
        const start = performance.now();
        const output = codec === "gzip" ? zlib.gunzipSync(asset.data[codec]) : zlib.brotliDecompressSync(asset.data[codec]);
        timings.push(performance.now() - start);
        // Force use of the result without including an expensive checksum in timing.
        if (output.length !== asset.data.identity.length) throw new Error("Decoded size mismatch");
      }
      const elapsed = performance.now() - totalStart;
      const cpu = process.cpuUsage(beforeCpu);
      if (round < 0) continue;
      // Three untimed rounds warm native codecs and memory allocation paths.
      measurements[codec].totals.push(elapsed);
      measurements[codec].cpu.push((cpu.user + cpu.system) / 1000);
      timings.forEach((value, index) => measurements[codec].perAsset[index].push(value));
    }
  }
  // These timings include allocation of decoded output, but exclude IO and JS parsing.
  return {
    rounds, cpu: os.cpus()[0].model, node: process.version,
    total: Object.fromEntries(Object.entries(measurements).map(([codec, value]) =>
      [codec, { ...statistics(value.totals), cpu: statistics(value.cpu) }])),
    perAsset: assets.map((asset, index) => ({
      name: asset.name, bytes: asset.data.identity.length,
      gzip: statistics(measurements.gzip.perAsset[index]), br: statistics(measurements.br.perAsset[index])
    }))
  };
}

// This page fetches bytes only: it never executes the official renderer or calls CLI.
async function browserBench() {
  // The blank page excludes React updates, theme effects and JS bundle execution.
  const metadata = await (await fetch("/metadata")).json();
  performance.setResourceTimingBufferSize(5000);
  const stats = values => {
    const sorted = [...values].sort((a, b) => a - b);
    const pick = p => Number(sorted[Math.max(0, Math.ceil(sorted.length * p) - 1)].toFixed(3));
    return { medianMs: pick(0.5), p95Ms: pick(0.95), minMs: pick(0), maxMs: pick(1) };
  };
  const supported = {};
  for (const codec of ["gzip", "brotli"]) {
    try { new DecompressionStream(codec); supported[codec] = true; } catch { supported[codec] = false; }
  }
  const blobs = await Promise.all(metadata.assets.map(async (_, i) =>
    new Blob([await (await fetch(`/asset/${i}/gzip/raw`)).arrayBuffer()])));
  // Blob input is created before timing; only decoding and output assembly remain.
  const perAsset = blobs.map(() => []);
  const totals = [];
  // Measure in-memory gzip separately from HTTP receiving and content decoding.
  for (let round = -3; round < 20; round++) {
    const startTotal = performance.now();
    for (let index = 0; index < blobs.length; index++) {
      const start = performance.now();
      const bytes = await new Response(blobs[index].stream()
        .pipeThrough(new DecompressionStream("gzip"))).arrayBuffer();
      const elapsed = performance.now() - start;
      if (bytes.byteLength !== metadata.assets[index].sizes.identity) throw new Error("Gzip size mismatch");
      if (round >= 0) perAsset[index].push(elapsed);
      // Validate bytes outside the timed interval, on the first measured iteration.
      if (round === 0) {
        const digest = await crypto.subtle.digest("SHA-256", bytes);
        const hex = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
        if (hex !== metadata.assets[index].sha256) throw new Error("Gzip digest mismatch");
      }
    }
    // The first checked iteration includes checksums, so do not use its total.
    if (round > 0) totals.push(performance.now() - startTotal);
  }
  const requests = { identity: [], gzip: [], br: [] };
  // HTTP variants carry identical decoded bytes but deliberately different sizes.
  let sequence = 0;
  const longTasks = [];
  const observer = new PerformanceObserver(list => {
    longTasks.push(...list.getEntries().map(entry => ({ startTime: entry.startTime, duration: entry.duration })));
  });
  observer.observe({ type: "longtask" });
  // A Latin-square ordering distributes warm sockets and GC effects across codecs.
  for (let round = -3; round < 24; round++) {
    const codecs = ["identity", "gzip", "br"];
    const offset = ((round % 3) + 3) % 3;
    for (const codec of [...codecs.slice(offset), ...codecs.slice(0, offset)]) {
      const start = performance.now();
      await Promise.all(metadata.assets.map(async (asset, index) => {
        // Parallel reception resembles a page importing several large resources.
        const response = await fetch(`/asset/${index}/${codec}/decoded?sequence=${sequence++}`, { cache: "no-store" });
        const bytes = await response.arrayBuffer();
        if (bytes.byteLength !== asset.sizes.identity) throw new Error("HTTP decoded size mismatch");
      }));
      if (round >= 0) requests[codec].push(performance.now() - start);
    }
  }
  // The browser's HTTP numbers include receiving, decoder work and output allocation.
  await new Promise(resolve => setTimeout(resolve, 100));
  longTasks.push(...observer.takeRecords().map(entry => ({ startTime: entry.startTime, duration: entry.duration })));
  observer.disconnect();
  const resources = performance.getEntriesByType("resource").filter(entry => entry.name.includes("/decoded?"));
  // Resource Timing supplies byte counts, not a dedicated decompression duration.
  const result = {
    ua: navigator.userAgent, supported,
    gzipStream: {
      rounds: totals.length, total: stats(totals),
      perAsset: metadata.assets.map((asset, index) => ({ name: asset.name, ...stats(perAsset[index]) }))
    },
    httpReceiveAndDecode: {
      rounds: 24, total: Object.fromEntries(Object.entries(requests).map(([codec, values]) => [codec, stats(values)])),
      longTasks, bytes: Object.fromEntries(["identity", "gzip", "br"].map(codec => {
        const relevant = resources.filter(entry => entry.name.includes(`/${codec}/decoded?`));
        return [codec, { encoded: relevant.slice(-7).reduce((sum, entry) => sum + entry.encodedBodySize, 0),
          decoded: relevant.slice(-7).reduce((sum, entry) => sum + entry.decodedBodySize, 0) }];
      }))
    }
  };
  // Persist only measurements, without credentials, user messages or browser history.
  await fetch("/report", { method: "POST", headers: {
    "content-type": "application/json", "x-benchmark-token": metadata.token
  }, body: JSON.stringify(result) });
  window.decompressionResult = result;
  document.body.textContent = "Measurements completed. Results saved in the project logs.";
  return result;
}

async function main() {
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  const node = measureNode();
  const report = {
    at: new Date().toISOString(), node,
    methodology: {
      node: "Preloaded synchronous decoding including output allocation; excludes disk, HTTP and script execution.",
      gzipStream: "Browser in-memory streaming gzip decoding and output assembly; excludes input download.",
      http: "Parallel loopback reception, content decoding and output assembly; not pure decoder CPU time.",
      scope: "Local desktop only. No Android measurements or application rendering measurements."
    }
  };
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify(node, null, 2));
  if (!process.argv.includes("--serve")) return;
  const token = randomUUID();
  // Checksums are calculated outside all measured intervals.
  const metadata = {
    token, assets: assets.map(asset => ({
      name: asset.name, sha256: createHash("sha256").update(asset.data.identity).digest("hex"),
      sizes: Object.fromEntries(Object.entries(asset.data).map(([codec, bytes]) => [codec, bytes.length]))
    }))
  };
  // Loopback-only synthetic server isolates the benchmark from the real backend.
  const server = http.createServer((request, response) => {
    const url = new URL(request.url, "http://localhost");
    const headers = { "cache-control": "no-store" };
    if (url.pathname === "/") {
      response.writeHead(200, { ...headers, "content-type": "text/html; charset=utf-8" });
      response.end(`<!doctype html><html><head><title>Decompression benchmark</title></head><body>Benchmark ready<script>window.runDecompressionBenchmark=${browserBench.toString()}</script></body></html>`);
      return;
    }
    if (url.pathname === "/metadata") {
      response.writeHead(200, { ...headers, "content-type": "application/json" });
      response.end(JSON.stringify(metadata));
      return;
    }
    const match = url.pathname.match(/^\/asset\/(\d+)\/(identity|gzip|br)\/(raw|decoded)$/);
    if (match && Number(match[1]) < assets.length) {
      const [, index, codec, mode] = match;
      const bytes = assets[Number(index)].data[codec];
      response.writeHead(200, {
        ...headers, "content-type": "application/octet-stream", "content-length": bytes.length,
        ...(mode === "decoded" && codec !== "identity" ? { "content-encoding": codec } : {})
      });
      response.end(bytes);
      return;
    }
    if (request.method === "POST" && request.headers["x-benchmark-token"] === token) {
      if (url.pathname === "/stop") {
        // Only the private benchmark process is stopped, never the project backend.
        response.end("stopped");
        server.close();
        return;
      }
      if (url.pathname === "/report") {
        let body = "";
        request.on("data", chunk => {
          body += chunk;
          if (body.length > 1024 * 1024) request.destroy();
        });
        request.on("end", () => {
          try {
            report.browser = JSON.parse(body);
            // Preserve successive browser runs for comparison instead of overwriting.
            (report.browserRuns ||= []).push(report.browser);
            fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n");
            response.end("saved");
          } catch { response.writeHead(400); response.end(); }
        });
        return;
      }
    }
    response.writeHead(404); response.end();
  });
  server.listen(0, "127.0.0.1", () => {
    const url = `http://127.0.0.1:${server.address().port}/`;
    fs.writeFileSync(path.join(projectRoot, "logs/decompression-server.json"), JSON.stringify({ url, token, pid: process.pid }));
    console.log(`Benchmark server: ${url}`);
  });
}

main().catch(error => { console.error(error); process.exitCode = 1; });
