const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const http = require("node:http");
const { once } = require("node:events");
const { createLanAccessGuard, loadCredentials, isLoopback } = require("../src/lan-auth");

const username = "codex";
const password = "fixture-secret";
const loginPath = "/__bridge/lan-login";
const logoutPath = "/__bridge/lan-logout";
const host = "192.168.5.155:4387";
// Fixture credentials must never replace the user's actual saved configuration.
const env = { CODEX_BROWSER_LAN_USERNAME: username, CODEX_BROWSER_LAN_PASSWORD: password };

function temporaryCredentials(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "codex-lan-auth-"));
  // Cleanup is restricted to a directory created solely for this test.
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  return path.join(directory, "config", "lan-auth.json");
}

function form(overrides = {}) {
  // Native forms URL-encode secrets and return destinations, including punctuation.
  return new URLSearchParams({ username, password, next: "/local/test?view=chat", ...overrides }).toString();
}

async function fixture(t) {
  // Use a controlled clock instead of waiting twelve real hours for session expiry.
  let time = 1;
  const makeGuard = () => createLanAccessGuard({
    port: 4387, credentialsFile: temporaryCredentials(t), env, now: () => time
  });
  let guard = makeGuard();
  // These test-only socket fields represent a genuine LAN connection.
  let socket = { localAddress: "192.168.5.155", remoteAddress: "192.168.5.42" };
  let reached = 0;
  let csrf;
  const server = http.createServer(async (request, response) => {
    // Preserve the actual stream while substituting only the peer classification.
    const input = {
      url: request.url, method: request.method, headers: request.headers, socket,
      on: request.on.bind(request), off: request.off.bind(request), resume: request.resume.bind(request)
    };
    try {
      const allowed = await guard(input, response);
      csrf = input.lanCsrfToken || csrf;
      if (!allowed) return;
      reached += 1;
      response.writeHead(200).end("application");
    } catch (error) {
      response.writeHead(500).end(String(error));
    }
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => new Promise(resolve => {
    // Close keep-alive sockets too; tests must leave no background service running.
    server.close(resolve);
    server.closeAllConnections();
  }));
  const base = `http://127.0.0.1:${server.address().port}`;
  const request = (route = "/", options = {}) => new Promise((resolve, reject) => {
    // node:http preserves explicit Host headers unlike some fetch implementations.
    const req = http.request(base + route, {
      method: options.method || "GET", headers: { host, ...options.headers }
    }, response => {
      let body = "";
      response.setEncoding("utf8");
      response.on("data", chunk => { body += chunk; });
      response.on("end", () => resolve({ status: response.statusCode, headers: response.headers, body }));
    });
    req.on("error", reject);
    req.setTimeout(5000, () => req.destroy(new Error("HTTP test timed out")));
    req.end(options.body);
  });
  const login = (body = form(), headers = {}) => request(loginPath, {
    // Login POSTs must advertise the same Origin as the receiving HTTP authority.
    method: "POST", body,
    headers: { origin: `http://${host}`, "content-type": "application/x-www-form-urlencoded", ...headers }
  });
  return {
    request, login,
    cookie: response => response.headers["set-cookie"][0].split(";")[0],
    advance: value => { time += value; },
    // Replacing the guard simulates a backend restart with no persisted sessions.
    restart: () => { guard = makeGuard(); },
    socket: value => { socket = value; },
    reached: () => reached,
    csrf: () => csrf
  };
}

test("saved credentials are stable across starts and environment overrides do not write secrets", t => {
  const file = temporaryCredentials(t);
  const initial = loadCredentials(file, {});
  assert.equal(initial.username, "codex");
  assert.match(initial.password, /^[A-Za-z0-9_-]{43}$/);
  // Environment overrides must leave the original disk credentials unchanged.
  assert.deepEqual(loadCredentials(file, {}), initial);
  assert.deepEqual(loadCredentials(file, env), { username, password });
  assert.deepEqual(loadCredentials(file, {}), initial);
  // Partial or empty environment configuration must not disable authentication.
  assert.throws(() => loadCredentials(file, { CODEX_BROWSER_LAN_USERNAME: username }));
  assert.throws(() => loadCredentials(file, { CODEX_BROWSER_LAN_PASSWORD: "" }));
  // Windows editors may prepend a UTF-8 BOM to an otherwise valid JSON file.
  fs.writeFileSync(file, "\uFEFF" + JSON.stringify(initial));
  assert.deepEqual(loadCredentials(file, {}), initial);
});

test("corrupt credentials fail closed instead of resetting the password", t => {
  const file = temporaryCredentials(t);
  loadCredentials(file, {});
  for (const content of ["{", "", "null", '{"username":"codex","password":""}']) {
    // Failed starts must preserve the invalid file for the user to correct.
    fs.writeFileSync(file, content);
    assert.throws(() => loadCredentials(file, {}));
    assert.equal(fs.readFileSync(file, "utf8"), content);
  }
});

test("login page is public, escapes fields, and document redirects preserve deep links", async t => {
  const f = await fixture(t);
  const page = await f.request(loginPath);
  assert.equal(page.status, 200);
  assert.match(page.body, /<html lang="zh-CN">/);
  assert.match(page.body, /autocomplete="current-password"/);
  assert.equal(page.body.includes(password), false);
  assert.equal(page.body.includes("localStorage"), false);
  assert.equal(page.headers["www-authenticate"], undefined);
  // Both markup and credentials stay outside cacheable application responses.
  assert.equal(page.headers["cache-control"], "no-store");
  assert.equal(page.headers["referrer-policy"], "same-origin");
  assert.match(page.headers["content-security-policy"], /frame-ancestors 'none'/);
  const css = await f.request("/__bridge/lan-login.css");
  assert.equal(css.status, 200);
  assert.match(css.headers["content-type"], /text\/css/);
  // Login page and stylesheet are the only public resources.
  assert.equal(f.reached(), 0);
  const target = "/local/example?view=chat";
  const redirect = await f.request(target, { headers: { accept: "text/html" } });
  assert.equal(redirect.status, 303);
  assert.equal(redirect.headers.location, `${loginPath}?next=${encodeURIComponent(target)}`);
  const escaped = await f.request(`${loginPath}?next=${encodeURIComponent('/local/a?x="><script>')}`);
  // A return URL cannot inject executable markup into the hidden input.
  assert.equal(escaped.body.includes("<script>"), false);
});

test("all application routes reject unauthenticated and legacy authorization requests", async t => {
  const f = await fixture(t);
  for (const route of ["/", "/local/example", "/assets/example.js", "/__bridge/status",
    "/__bridge/file", "/__bridge/events", "/__extensions/themes/nahida/theme.css"]) {
    const denied = await f.request(route);
    // APIs report an explicit authentication error instead of fake successful results.
    assert.equal(denied.status, 401, route);
    assert.equal(JSON.parse(denied.body).error, "LAN_LOGIN_REQUIRED");
    assert.equal(denied.headers["www-authenticate"], undefined);
  }
  // An old cached Authorization header must never authenticate this new flow.
  const old = await f.request("/", {
    headers: { authorization: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}` }
  });
  assert.equal(old.status, 401);
  assert.equal(f.reached(), 0);
});

test("successful login uses an opaque cookie, preserves routes, and rotates sessions", async t => {
  const f = await fixture(t);
  const response = await f.login();
  assert.equal(response.status, 303);
  assert.equal(response.headers.location, "/local/test?view=chat");
  const header = response.headers["set-cookie"][0];
  // HttpOnly and SameSite protect session tokens from script reads and cross-site posts.
  assert.match(header, /^codex_lan_session=[A-Za-z0-9_-]{43}; Path=\/; HttpOnly; SameSite=Strict; Max-Age=43200$/);
  assert.equal(header.includes(password), false);
  const cookie = f.cookie(response);
  assert.equal((await f.request("/__bridge/status", { headers: { cookie } })).status, 200);
  // Reloading the login URL with a valid session returns directly to its target.
  assert.equal((await f.request(loginPath + "?next=%2Fsettings", { headers: { cookie } })).headers.location, "/settings");
  const next = await f.login(form(), { cookie });
  assert.notEqual(f.cookie(next), cookie);
  assert.equal((await f.request("/", { headers: { cookie } })).status, 401);
  assert.equal((await f.request("/", { headers: { cookie: f.cookie(next) } })).status, 200);
});

test("wrong credentials never create a session or reflect the submitted password", async t => {
  const f = await fixture(t);
  for (const overrides of [{ username: "other" }, { password: "wrong-secret" }, { password: "" }]) {
    const response = await f.login(form(overrides));
    assert.equal(response.status, 401);
    assert.equal(response.headers["set-cookie"], undefined);
    // The form may display a generic error, but never the submitted secret.
    assert.match(response.body, /用户名或密码不正确/);
    assert.equal(response.body.includes("wrong-secret"), false);
    assert.equal(response.headers["www-authenticate"], undefined);
  }
  // A forged or duplicate cookie must not become an authenticated session.
  for (const cookie of ["codex_lan_session=bad", `codex_lan_session=${"a".repeat(43)}`,
    "codex_lan_session=x; codex_lan_session=y"]) {
    assert.equal((await f.request("/", { headers: { cookie } })).status, 401);
  }
});

test("session expiry, backend restart, and logout revoke access", async t => {
  const f = await fixture(t);
  let cookie = f.cookie(await f.login());
  f.advance(12 * 60 * 60 * 1000 - 1);
  assert.equal((await f.request("/", { headers: { cookie } })).status, 200);
  f.advance(1);
  // The exact expiry boundary is expired, not one additional successful request.
  assert.equal((await f.request("/", { headers: { cookie } })).status, 401);
  cookie = f.cookie(await f.login());
  // GET cannot accidentally sign out a session through prefetch or an image.
  assert.equal((await f.request(logoutPath, { headers: { cookie } })).status, 405);
  assert.ok(f.csrf(), "authenticated requests must expose a session CSRF token to the fixture");
  const logout = await f.request(logoutPath, {
    method: "POST", headers: { cookie, "x-codex-csrf": f.csrf() }
  });
  assert.equal(logout.status, 303);
  assert.match(logout.headers["set-cookie"][0], /Max-Age=0/);
  // Replaying a signed-out cookie must fail even outside the original browser.
  assert.equal((await f.request("/", { headers: { cookie } })).status, 401);
  cookie = f.cookie(await f.login());
  f.restart();
  assert.equal((await f.request("/", { headers: { cookie } })).status, 401);
});

test("reverse-proxy host and protocol are accepted while CSRF metadata remains enforced", async t => {
  const f = await fixture(t);
  const cookie = f.cookie(await f.login());
  // The reverse proxy may present any public hostname and terminate HTTPS upstream.
  for (const headers of [
    { host: "evil.example:443" }, { host: "127.0.0.1:4387" },
    { origin: "https://public.example" }
  ]) {
    assert.equal((await f.request("/", { headers: { cookie, ...headers } })).status, 200);
  }
  assert.equal((await f.request("/", { headers: { "x-forwarded-for": "127.0.0.1" } })).status, 401);
  assert.equal((await f.login(form(), { origin: "https://evil.example" })).status, 303);
  assert.equal((await f.request("/__bridge/rpc", { method: "POST", headers: { cookie } })).status, 403);
  assert.equal((await f.request("/__bridge/rpc", {
    method: "POST", headers: { cookie, "x-codex-csrf": f.csrf() }
  })).status, 200);
  assert.equal((await f.request("/", {
    headers: { cookie, "sec-fetch-site": "cross-site" }
  })).status, 403);
});

test("only actual loopback peers are exempt and localhost native requests remain usable", async t => {
  const f = await fixture(t);
  for (const address of ["127.0.0.1", "127.0.0.2", "::1", "::ffff:127.0.0.1"]) {
    assert.equal(isLoopback(address), true);
    f.socket({ localAddress: "127.0.0.1", remoteAddress: address });
    const result = await f.request("/", { method: "POST", headers: { host: "localhost:4387" } });
    assert.equal(result.status, 200);
  }
  // Connecting to the machine's LAN IP still requires a session, even locally.
  f.socket({ localAddress: "192.168.5.155", remoteAddress: "192.168.5.155" });
  assert.equal((await f.request()).status, 401);
});

test("login redirects reject external URLs, control bytes, and authentication loops", async t => {
  const f = await fixture(t);
  for (const next of ["https://evil.example", "//evil.example", "/\\evil", "/%2f%2fevil",
    "/%0d%0aevil", loginPath, logoutPath, "/a".repeat(1100)]) {
    const response = await f.login(form({ next }));
    // Unsafe destinations fall back to the root instead of becoming open redirects.
    assert.equal(response.headers.location, "/", next);
  }
  // Relative paths with a legitimate query and fragment remain usable.
  assert.equal((await f.login(form({ next: "/settings?tab=appearance#fonts" }))).headers.location,
    "/settings?tab=appearance#fonts");
});

test("invalid forms fail explicitly and guessing limits expire", async t => {
  const f = await fixture(t);
  for (const [body, headers, status] of [
    ["{}", { "content-type": "application/json" }, 415],
    ["username=codex", {}, 400],
    [form() + "&username=other", {}, 400],
    [form() + "&next=/a", {}, 400],
    ["x".repeat(9000), {}, 413]
  ]) assert.equal((await f.login(body, headers)).status, status);
  // Unsupported methods must fail without parsing a login or creating a session.
  assert.equal((await f.request(loginPath, { method: "PUT", headers: { origin: `http://${host}` } })).status, 405);
  for (let index = 0; index < 20; index += 1) {
    assert.equal((await f.login(form({ password: "wrong" }))).status, 401);
  }
  // Ordinary login page visits do not count toward the guessing budget.
  assert.equal((await f.request(loginPath)).status, 200);
  const limited = await f.login();
  assert.equal(limited.status, 429);
  assert.equal(limited.headers["retry-after"], "60");
  f.advance(60000);
  assert.equal((await f.login()).status, 303);
});

test("real wildcard listener protects LAN access but preserves localhost", async t => {
  // Verify true socket peer classification, not just the substituted fixture above.
  const address = Object.values(os.networkInterfaces()).flat().find(
    item => item && !item.internal && item.family === "IPv4"
  )?.address;
  if (!address) { t.skip("No LAN IPv4 interface available"); return; }
  let guard;
  const server = http.createServer(async (request, response) => {
    if (await guard(request, response)) response.writeHead(200).end("authenticated");
  });
  server.listen(0, "0.0.0.0");
  await once(server, "listening");
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
  const port = server.address().port;
  guard = createLanAccessGuard({ port, credentialsFile: temporaryCredentials(t), env });
  // Loopback keeps local notification and status callers working without cookies.
  const local = await fetch(`http://127.0.0.1:${port}/`);
  assert.equal(local.status, 200);
  await local.text();
  const base = `http://${address}:${port}`;
  const denied = await fetch(base + "/");
  assert.equal(denied.status, 401);
  await denied.text();
  const login = await fetch(base + loginPath, {
    method: "POST", headers: { origin: base, "content-type": "application/x-www-form-urlencoded" },
    body: form(), redirect: "manual", signal: AbortSignal.timeout(5000)
  });
  assert.equal(login.status, 303);
  await login.text();
  const allowed = await fetch(base + "/", {
    headers: { cookie: login.headers.get("set-cookie").split(";")[0] }
  });
  assert.equal(allowed.status, 200);
  await allowed.text();
});

test("server awaits authentication before routes and retains one wildcard listener", () => {
  const project = path.resolve(__dirname, "..");
  const source = fs.readFileSync(path.join(project, "src", "server.js"), "utf8");
  const start = source.indexOf("const server = http.createServer");
  const guard = source.indexOf("if (!await allowRequest(request, response)) return;", start);
  const url = source.indexOf("const url = new URL(request.url", start);
  assert.ok(start >= 0 && guard > start && url > guard);
  // Source checks validate production integration without running a real model or CLI.
  assert.equal((source.match(/server\.listen\(/g) || []).length, 1);
  assert.ok(source.includes('server.listen(port, "0.0.0.0"'));
  assert.ok(source.includes('if (isLan && url.pathname.endsWith("/activate"))'));
  assert.ok(source.indexOf("const allowRequest =") < source.indexOf("startAppServer().catch"));
  const auth = fs.readFileSync(path.join(project, "src", "lan-auth.js"), "utf8");
  assert.equal(/www-authenticate|decodeBasic|headers\.authorization/i.test(auth), false);
});
