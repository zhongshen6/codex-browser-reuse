const fs = require("node:fs");
const path = require("node:path");
const { createHash, randomBytes, timingSafeEqual } = require("node:crypto");

const LOGIN_PATH = "/__bridge/lan-login";
const LOGOUT_PATH = "/__bridge/lan-logout";
const CSRF_HEADER = "x-codex-csrf";
const COOKIE_NAME = "codex_lan_session";
const SESSION_MS = 12 * 60 * 60 * 1000;
// Limit both password guesses and attacker-controlled in-memory state.
const FAILURE_WINDOW_MS = 60000;
const MAX_FAILURES = 20;
const MAX_ENTRIES = 1024;

// Trust socket addresses, never Host or proxy headers, for the local exemption.
function normalizeAddress(address = "") {
  return address.replace(/^::ffff:/i, "");
}

function isLoopback(address) {
  return normalizeAddress(address) === "::1" || /^127(?:\.\d{1,3}){3}$/.test(normalizeAddress(address));
}

function validateCredentials(value) {
  // Keep configuration validation independent of any browser transport format.
  if (!value || typeof value.username !== "string" || !value.username ||
      /[\x00-\x1f\x7f]/.test(value.username) ||
      typeof value.password !== "string" || !value.password ||
      /[\x00-\x1f\x7f]/.test(value.password) ||
      Buffer.byteLength(JSON.stringify([value.username, value.password]), "utf8") > 2048) {
    throw new Error("Invalid LAN credentials: expected a username and nonempty password.");
  }
  return { username: value.username, password: value.password };
}

function loadCredentials(file, env = process.env) {
  // Overrides stay in the process environment and never overwrite saved secrets.
  if (env.CODEX_BROWSER_LAN_USERNAME !== undefined ||
      env.CODEX_BROWSER_LAN_PASSWORD !== undefined) {
    return validateCredentials({
      username: env.CODEX_BROWSER_LAN_USERNAME ?? "codex",
      password: env.CODEX_BROWSER_LAN_PASSWORD
    });
  }
  try {
    // Project-relative saved credentials preserve the password across relocation.
    return validateCredentials(JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "")));
  } catch (error) {
    // Corrupt or inaccessible configuration must fail closed, not reset a password.
    if (error.code !== "ENOENT") throw error;
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const credentials = { username: "codex", password: randomBytes(32).toString("base64url") };
  try {
    // Exclusive creation lets simultaneous first starts retain the same password.
    fs.writeFileSync(file, `${JSON.stringify(credentials, null, 2)}\n`, {
      encoding: "utf8", flag: "wx", mode: 0o600
    });
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
    return loadCredentials(file, {});
  }
  return credentials;
}

function digest(value) {
  // Compare fixed-size digests instead of password-length-dependent byte arrays.
  return createHash("sha256").update(value).digest();
}

function escapeHtml(value) {
  // User-controlled return URLs may appear in a hidden input, never as raw markup.
  return value.replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

function safeNext(value, deployment) {
  // Accept only same-origin relative paths and never return to an authentication route.
  if (typeof value !== "string" || value.length > 2048 || !value.startsWith("/") ||
      value.startsWith("//") || /[\\\x00-\x20\x7f]/.test(value)) return "/";
  try {
    const decoded = decodeURIComponent(value);
    if (decoded.startsWith("//") || /[\\\x00-\x1f\x7f]/.test(decoded)) return "/";
    const target = new URL(value, "http://local.invalid");
    const loginPath = deployment.publicPath(LOGIN_PATH);
    const logoutPath = deployment.publicPath(LOGOUT_PATH);
    if (target.origin !== "http://local.invalid" ||
        [loginPath, logoutPath].includes(target.pathname) ||
        (deployment.basePath !== "/" &&
          !target.pathname.startsWith(deployment.basePath))) return deployment.basePath;
    return target.pathname + target.search + target.hash;
  } catch { return "/"; }
}

function finish(response, status, body = "", headers = {}) {
  // Never cache responses or trigger a browser's native credential prompt.
  response.writeHead(status, {
    "content-type": "text/plain; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    // Native form POSTs need a non-opaque Origin; strip referrals only across origins.
    "referrer-policy": "same-origin",
    ...headers
  });
  response.end(body);
  return false;
}

function redirect(response, destination, headers = {}) {
  // POST redirects use 303 so browsers do not resend passwords at the target route.
  return finish(response, 303, "", { location: destination, ...headers });
}

function page(response, {
  status = 200, next = "/", username, error = "", headers = {},
  loginPath = LOGIN_PATH, cssPath = "/__bridge/lan-login.css", deployment
}) {
  // This independent form loads no private state or official renderer assets.
  // Keep native form submission and password-manager support without client scripts.
  const html = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,interactive-widget=resizes-content">
<title>Codex - 登录</title><link rel="stylesheet" href="${cssPath}"></head>
<body><main><header><strong>Codex</strong><span>浏览器版</span></header>
<form method="post" action="${loginPath}">
<h1>局域网登录</h1>
${error ? `<p class="error" role="alert">${escapeHtml(error)}</p>` : ""}
<input type="hidden" name="next" value="${escapeHtml(safeNext(next, deployment))}">
<label for="username">用户名</label>
<input id="username" name="username" type="text" autocomplete="username" maxlength="256" value="${escapeHtml(username)}" required>
<label for="password">密码</label>
<input id="password" name="password" type="password" autocomplete="current-password" maxlength="2048" required>
<button type="submit">登录</button></form></main></body></html>`;
  return finish(response, status, html, {
    "content-type": "text/html; charset=utf-8",
    "content-security-policy": "default-src 'none'; style-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
    ...headers
  });
}

async function readForm(request) {
  // Reject unsupported bodies before reading them; accept native HTML forms only.
  if ((request.headers["content-type"] || "").split(";")[0].trim() !==
      "application/x-www-form-urlencoded") throw Object.assign(new Error(), { status: 415 });
  if (Number(request.headers["content-length"]) > 8192) {
    request.resume();
    throw Object.assign(new Error(), { status: 413 });
  }
  const body = await new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    // Stalled form submissions cannot hold handlers open indefinitely.
    const timer = setTimeout(() => fail(408), 10000);
    timer.unref();
    // Remove stream listeners on every outcome, including oversized chunked bodies.
    const clean = () => {
      clearTimeout(timer);
      request.off("data", data);
      request.off("end", end);
      request.off("error", error);
      request.off("aborted", aborted);
    };
    const fail = status => {
      clean();
      request.resume();
      reject(Object.assign(new Error(), { status }));
    };
    const data = chunk => {
      size += chunk.length;
      if (size > 8192) { fail(413); return; }
      chunks.push(chunk);
    };
    const end = () => { clean(); resolve(Buffer.concat(chunks).toString("utf8")); };
    const error = () => fail(400);
    const aborted = () => fail(400);
    request.on("data", data);
    request.on("end", end);
    request.on("error", error);
    request.on("aborted", aborted);
  });
  const form = new URLSearchParams(body);
  // Duplicate fields create ambiguous credential and redirect interpretations.
  if (form.getAll("username").length !== 1 || form.getAll("password").length !== 1 ||
      form.getAll("next").length > 1) throw Object.assign(new Error(), { status: 400 });
  return form;
}

function sessionCookie(token, basePath, secure = false) {
  // HTTP LAN support precludes Secure; TLS receives Secure automatically.
  return `${COOKIE_NAME}=${token}; Path=${basePath}; HttpOnly; SameSite=Strict; Max-Age=${token ? SESSION_MS / 1000 : 0}${secure ? "; Secure" : ""}`;
}

function createLanAccessGuard({ credentialsFile, deployment, env = process.env, now = Date.now }) {
  // Unit fixtures may omit deployment; production always passes the project setting.
  deployment ??= {
    basePath: "/",
    publicPath: value => value,
    internalPath: value => value
  };
  const credentials = loadCredentials(credentialsFile, env);
  // Structured fields avoid username/password separator collisions.
  const expected = digest(JSON.stringify([credentials.username, credentials.password]));
  const sessions = new Map();
  const failures = new Map();
  const cssFile = path.join(__dirname, "lan-login.css");
  const loginPath = deployment.publicPath(LOGIN_PATH);
  const logoutPath = deployment.publicPath(LOGOUT_PATH);
  const cssPath = deployment.publicPath("/__bridge/lan-login.css");

  return async function allowRequest(request, response) {
    const remote = normalizeAddress(request.socket.remoteAddress);
    const local = normalizeAddress(request.socket.localAddress);
    const loopback = isLoopback(remote);
    const host = request.headers.host;
    const origin = request.headers.origin;
    const unsafe = !["GET", "HEAD", "OPTIONS"].includes(request.method);
    // The reverse proxy owns hostname and TLS termination; do not validate either here.
    if (!host || request.headers["sec-fetch-site"] === "cross-site") {
      return finish(response, 403, "Forbidden.");
    }
    let url;
    try { url = new URL(request.url, `http://${host}`); }
    catch { return finish(response, 400, "Invalid request URL."); }
    if (!deployment.internalPath(url.pathname)) return finish(response, 404, "Not found.");
    // Expiry is absolute, not extended by background polling or asset requests.
    const time = now();
    // Hash session keys so the in-memory map contains no usable cookie values.
    const tokens = (request.headers.cookie || "").split(";").map(value => value.trim())
      .filter(value => value.startsWith(`${COOKIE_NAME}=`));
    const token = tokens.length === 1 ? tokens[0].slice(COOKIE_NAME.length + 1) : "";
    const key = /^[A-Za-z0-9_-]{43}$/.test(token) ? digest(token).toString("hex") : "";
    // Duplicate cookie names are rejected rather than choosing a parser-specific winner.
    const session = key && sessions.get(key);
    const authenticated = Boolean(session && session.expiresAt > time);
    if (session && !authenticated) sessions.delete(key);
    if (authenticated) request.lanCsrfToken = session.csrf;

    if (url.pathname === cssPath) {
      // Only this public stylesheet is exempt, never arbitrary renderer assets.
      if (!["GET", "HEAD"].includes(request.method)) return finish(response, 405, "", { allow: "GET, HEAD" });
      return finish(response, 200, request.method === "HEAD" ? "" : fs.readFileSync(cssFile), {
        "content-type": "text/css; charset=utf-8"
      });
    }
    if (url.pathname === loginPath) {
      if (["GET", "HEAD"].includes(request.method)) {
        if (authenticated) return redirect(response, safeNext(url.searchParams.get("next"), deployment));
        return page(response, {
          next: url.searchParams.get("next"), username: credentials.username,
          loginPath, cssPath, deployment
        });
      }
      if (request.method !== "POST") return finish(response, 405, "", { allow: "GET, HEAD, POST" });
      for (const [address, value] of failures) {
        if (time - value.start >= FAILURE_WINDOW_MS) failures.delete(address);
      }
      const failure = failures.get(remote);
      if (failure && failure.count >= MAX_FAILURES) {
        return page(response, {
          status: 429, username: credentials.username, error: "尝试次数过多，请稍后重试。",
          loginPath, cssPath, deployment,
          headers: { "retry-after": String(Math.ceil((FAILURE_WINDOW_MS - (time - failure.start)) / 1000)) }
        });
      }
      let form;
      try { form = await readForm(request); }
      catch (error) { return finish(response, error.status || 400, "Invalid login request."); }
      // Submissions may finish while this body is read; use current peer state.
      const current = failures.get(remote);
      const activeFailure = current && now() - current.start < FAILURE_WINDOW_MS ? current : null;
      if (activeFailure?.count >= MAX_FAILURES) {
        return page(response, {
          status: 429, username: credentials.username, error: "尝试次数过多，请稍后重试。",
          loginPath, cssPath, deployment,
          headers: { "retry-after": String(Math.ceil((FAILURE_WINDOW_MS - (now() - activeFailure.start)) / 1000)) }
        });
      }
      const supplied = digest(JSON.stringify([form.get("username"), form.get("password")]));
      if (!timingSafeEqual(supplied, expected)) {
        // Bound guessing state without logging submitted credentials.
        if (!activeFailure && failures.size >= MAX_ENTRIES) failures.delete(failures.keys().next().value);
        failures.set(remote, { start: activeFailure?.start ?? now(), count: (activeFailure?.count ?? 0) + 1 });
        return page(response, {
          status: 401, next: form.get("next"), username: credentials.username,
          error: "用户名或密码不正确。"
        });
      }
      failures.delete(remote);
      // Prune expired sessions on successful login before enforcing the capacity cap.
      for (const [sessionKey, expiry] of sessions) {
        if (expiry.expiresAt <= time) sessions.delete(sessionKey);
      }
      if (sessions.size >= MAX_ENTRIES) sessions.delete(sessions.keys().next().value);
      // Issue a fresh token on login; never promote a client-supplied session id.
      const fresh = randomBytes(32).toString("base64url");
      if (key) sessions.delete(key);
      sessions.set(digest(fresh).toString("hex"), {
        expiresAt: now() + SESSION_MS, csrf: randomBytes(32).toString("base64url")
      });
      return redirect(response, safeNext(form.get("next"), deployment), {
        "set-cookie": sessionCookie(fresh, deployment.basePath, Boolean(request.socket.encrypted))
      });
    }
    if (url.pathname === logoutPath) {
      // Logout is POST-only and revokes the server token as well as the browser cookie.
      if (request.method !== "POST") return finish(response, 405, "", { allow: "POST" });
      if (!authenticated || request.headers[CSRF_HEADER] !== session.csrf) {
        return finish(response, 403, "Invalid CSRF token.");
      }
      if (key) sessions.delete(key);
      return redirect(response, loginPath, {
        "set-cookie": sessionCookie("", deployment.basePath, Boolean(request.socket.encrypted))
      });
    }
    if (authenticated && unsafe && request.headers[CSRF_HEADER] !== session.csrf) {
      // The mounted page sends this token on every mutating bridge request.
      return finish(response, 403, "Invalid CSRF token.");
    }
    // Authentication routes above retain their semantics even on exempt localhost.
    if (loopback || authenticated) return true;
    // Document navigations redirect; APIs and assets receive explicit JSON errors.
    const navigation = ["GET", "HEAD"].includes(request.method) &&
      (request.headers["sec-fetch-mode"] === "navigate" || (request.headers.accept || "").includes("text/html"));
    if (navigation) return redirect(response,
      `${loginPath}?next=${encodeURIComponent(safeNext(request.url, deployment))}`);
    return finish(response, 401, JSON.stringify({ error: "LAN_LOGIN_REQUIRED", login: LOGIN_PATH }), {
      "content-type": "application/json; charset=utf-8"
    });
  };
}

module.exports = { createLanAccessGuard, loadCredentials, isLoopback };
