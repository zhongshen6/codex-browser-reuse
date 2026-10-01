const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const http = require("node:http");
const { once } = require("node:events");
const {
  QueuedFollowUpSendLocks, createQueuedFollowUpSendLockHandler
} = require("../queued-follow-up-send-locks");

const project = path.resolve(__dirname, "..");
const payload = (lockId = "owner-a", messageId = "message-a", conversationId = "thread-a") =>
  ({ conversationId, messageId, lockId });

test("migrated lock behavior matches the pinned official main-process class", () => {
  // Use the actual packaged implementation as an oracle, not a rewritten fixture.
  const source = fs.readFileSync(path.join(project,
    "runtime/codex-frontend-26.917.9434/.vite/build/main-BR_2NHW6.js"), "utf8");
  const start = source.indexOf("var zee=12e4,Bee=6e5,Vee=class");
  const end = source.indexOf(",Hee=class", start);
  assert.ok(start >= 0 && end > start, "Official send lock signature changed");
  const Official = vm.runInNewContext(source.slice(start, end) + "; Vee");
  let now = 0;
  const official = new Official(() => now);
  const migrated = new QueuedFollowUpSendLocks(() => now);
  // VM objects have different prototypes; compare serialized state, including leases.
  const snapshot = locks => JSON.parse(JSON.stringify({
    startingTurns: [...locks.startingTurns],
    activeLocks: [...locks.activeLocks.entries()],
    sentMessages: [...locks.sentMessages.entries()]
  }));
  // Include contention, stale releases, exact expiry boundaries, and duplicate sends.
  const steps = [
    ["tryAcquireStartTurn", "thread-a"], ["tryAcquireStartTurn", "thread-a"],
    ["releaseStartTurn", "thread-a"], ["tryAcquireStartTurn", "thread-a"],
    ["tryAcquire", payload()], ["tryAcquire", payload("owner-b")],
    ["release", { ...payload("owner-b"), sent: false }],
    ["tryAcquire", payload("owner-b")], ["time", 120000],
    ["tryAcquire", payload("owner-b")],
    ["release", { ...payload(), sent: false }],
    ["tryAcquire", payload("owner-c", "message-b")],
    ["release", { ...payload("owner-b"), sent: true }],
    ["tryAcquire", payload("owner-c")],
    ["tryAcquire", payload("owner-c", "message-b")],
    ["release", { ...payload("owner-c", "message-b"), sent: false }],
    ["tryAcquire", payload("owner-d", "message-b")],
    ["tryAcquire", payload("owner-x", "message-a", "thread-b")],
    ["time", 719999], ["tryAcquire", payload()],
    ["time", 720000], ["tryAcquire", payload()]
  ];
  for (const [method, value] of steps) {
    if (method === "time") { now = value; continue; }
    assert.equal(migrated[method](value), official[method](value), method);
    assert.deepEqual(snapshot(migrated), snapshot(official));
  }
});

async function fixture(t) {
  // Only the production HTTP adapter runs here: no CLI, account, or real conversation.
  let now = 0;
  const locks = new QueuedFollowUpSendLocks(() => now);
  const handler = createQueuedFollowUpSendLockHandler(locks);
  const server = http.createServer((request, response) => {
    if (!handler(request, response, new URL(request.url, "http://localhost").pathname)) {
      response.writeHead(404).end();
    }
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  // Close keep-alive sockets as well so tests do not leave a background service.
  t.after(() => new Promise(resolve => {
    server.close(resolve);
    server.closeAllConnections();
  }));
  const base = `http://127.0.0.1:${server.address().port}`;
  const request = async (operation, value, method = "POST") => {
    const response = await fetch(`${base}/__bridge/queued-follow-up-send-lock/${operation}`, {
      method, ...(method === "POST" ? { body: JSON.stringify(value) } : {}),
      signal: AbortSignal.timeout(5000)
    });
    return { status: response.status, body: await response.json() };
  };
  return { base, request, advance: ms => { now += ms; } };
}

test("HTTP lock is shared across clients, supports retry, and deduplicates successful sends", async t => {
  const f = await fixture(t);
  // Concurrent browser clients must not both win the same conversation lease.
  const results = await Promise.all([
    f.request("acquire", payload()), f.request("acquire", payload("owner-b"))
  ]);
  assert.deepEqual(results.map(r => r.status), [200, 200]);
  assert.equal(results.filter(r => r.body.acquired).length, 1);
  const owner = results[0].body.acquired ? "owner-a" : "owner-b";
  await f.request("release", { ...payload("not-the-owner"), sent: false });
  assert.equal((await f.request("acquire", payload("owner-c"))).body.acquired, false);
  await f.request("release", { ...payload(owner), sent: false });
  // A failed send frees the lease without recording the message as sent.
  assert.equal((await f.request("acquire", payload("owner-c"))).body.acquired, true);
  await f.request("release", { ...payload("owner-c"), sent: true });
  assert.equal((await f.request("acquire", payload("owner-d"))).body.acquired, false);
  assert.equal((await f.request("acquire", payload("owner-d", "message-b"))).body.acquired, true);
  f.advance(600000);
  assert.equal((await f.request("acquire", payload())).body.acquired, true);
});

test("HTTP invalid requests fail explicitly without acquiring a lease", async t => {
  const f = await fixture(t);
  // Invalid ids cannot collide with the official newline-separated dedupe key.
  for (const value of [null, [], {}, payload("", "message-a"), payload("a", "a\nb")]) {
    assert.equal((await f.request("acquire", value)).status, 400);
  }
  assert.equal((await f.request("release", payload())).status, 400);
  assert.equal((await f.request("acquire", payload(), "GET")).status, 405);
  assert.equal((await f.request("unknown", payload())).status, 404);
  assert.equal((await f.request("acquire", { ...payload(), extra: "x".repeat(9000) })).status, 413);
  const malformed = await fetch(`${f.base}/__bridge/queued-follow-up-send-lock/acquire`,
    { method: "POST", body: "{", signal: AbortSignal.timeout(5000) });
  assert.equal(malformed.status, 400);
  assert.equal((await f.request("acquire", payload())).body.acquired, true);
});

const bridgeSource = fs.readFileSync(path.join(project, "bridge.js"), "utf8");
const routeStart = bridgeSource.indexOf('      if (url.endsWith("/queued-follow-up-send-lock-acquire")');
const routeEnd = bridgeSource.indexOf("      // Both desktop pin operations", routeStart);
assert.ok(routeStart >= 0 && routeEnd > routeStart, "Bridge send lock branch changed");

function dispatch(operation, value, fetcher) {
  // Exercise the production browser branch in isolation and preserve its response id.
  return new Promise((resolve, reject) => {
    try {
      vm.runInNewContext(`(function () { ${bridgeSource.slice(routeStart, routeEnd)} })()`, {
        url: `/queued-follow-up-send-lock-${operation}`,
        message: { requestId: "browser-request", body: JSON.stringify(value) },
        fetch: fetcher, reply: resolve
      });
    } catch (error) { reject(error); }
  });
}

test("official browser requests reach the real lock adapter and keep response shape", async t => {
  const f = await fixture(t);
  // Browser transport only forwards the lock; it never submits a model message itself.
  const fetcher = (route, options) => fetch(f.base + route, options);
  const acquired = await dispatch("acquire", payload(), fetcher);
  assert.equal(acquired.requestId, "browser-request");
  assert.equal(acquired.responseType, "success");
  assert.deepEqual(JSON.parse(acquired.bodyJsonString), { acquired: true });
  const released = await dispatch("release", { ...payload(), sent: false }, fetcher);
  assert.equal(released.status, 200);
  assert.deepEqual(JSON.parse(released.bodyJsonString), {});
  const invalid = await dispatch("acquire", {}, fetcher);
  assert.equal(invalid.status, 400);
  assert.equal(invalid.responseType, "error");
});

test("browser transport reports old backend or network failure instead of silent lock denial", async () => {
  // This regression is the original bug: HTTP success with {} is not a lock result.
  for (const fetcher of [
    async () => ({ ok: true, status: 200, json: async () => ({}) }),
    async () => { throw new Error("network unavailable"); }
  ]) {
    const response = await dispatch("acquire", payload(), fetcher);
    assert.equal(response.status, 502);
    assert.equal(response.responseType, "error");
    assert.ok(JSON.parse(response.bodyJsonString).error);
  }
});

test("production lock adapter runs after the network and authentication guard", () => {
  // The standalone transport fixture must not obscure the real server's LAN boundary.
  const source = fs.readFileSync(path.join(project, "server.js"), "utf8");
  const guard = source.indexOf("if (!await allowRequest(request, response)) return;");
  const handler = source.indexOf("if (handleQueuedFollowUpSendLock(request, response, url.pathname))");
  assert.ok(guard >= 0 && handler > guard);
});
