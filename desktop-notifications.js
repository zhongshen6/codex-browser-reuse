const fs = require("node:fs");
const path = require("node:path");
const { spawn, execFile } = require("node:child_process");
const { randomUUID, createHash } = require("node:crypto");

const permissionMethods = new Set([
  "item/commandExecution/requestApproval",
  "item/fileChange/requestApproval",
  "item/permissions/requestApproval"
]);

function isMcpToolApproval(message) {
  const p = message.params || {};
  return message.method === "mcpServer/elicitation/request" &&
    p._meta?.codex_approval_kind === "mcp_tool_call";
}

function canApproveMcpTool(message) {
  const p = message.params || {};
  const schema = p.requestedSchema;
  // Native buttons only answer plain empty approval forms. Auth challenges,
  // connector-bound proofs, and forms with user data stay in the official UI.
  return isMcpToolApproval(message) && p.mode === "form" &&
    !p._meta?.connector_id && schema?.type === "object" &&
    schema.properties != null && !Array.isArray(schema.properties) &&
    Object.keys(schema.properties).length === 0 &&
    (schema.required == null || Array.isArray(schema.required) && schema.required.length === 0);
}

// Keep the Windows adapter separate from notification policy and CLI routing.
// The activator owns its own identity; no official Codex protocol is launched.
function createDesktopNotifications({ port, basePath = "/", readSettings, getPending, respond, log, soundDirectory }) {
  const appId = `CodexBrowserReuse.${port}`;
  const records = new Map();
  const threads = new Map();
  const turns = new Map();
  const clients = new Map();
  const recent = [];
  const helper = path.join(__dirname, "windows-notifications.ps1");
  let activationHost;
  let ready;

  function event(type, detail = {}) {
    const entry = { at: Date.now(), type, ...detail };
    recent.push(entry);
    if (recent.length > 200) recent.shift();
    log(entry);
  }

  // A heartbeat is a lease, not an assumption that a browser tab stays alive.
  function presence(payload) {
    if (!payload.clientId) return;
    if (payload.closed) {
      clients.delete(payload.clientId);
      return;
    }
    clients.set(payload.clientId, {
      at: Date.now(), focused: Boolean(payload.focused),
      visible: Boolean(payload.visible), threadId: payload.threadId || null
    });
  }

  function focused(threadId) {
    return [...clients.values()].some(client =>
      Date.now() - client.at < 7000 && client.focused && client.visible &&
      (!threadId || client.threadId === threadId));
  }

  function policy(kind, threadId) {
    const settings = readSettings();
    if (kind === "permission") return settings["notifications-permissions-enabled"] !== false;
    if (kind === "question") return settings["notifications-questions-enabled"] !== false;
    const mode = settings["notifications-turn-mode"] || "unfocused";
    return mode !== "off" && (mode === "always" || !focused());
  }

  function startHost() {
    if (ready) return ready;
    ready = new Promise((resolve, reject) => {
      activationHost = spawn("powershell.exe", [
        "-NoLogo", "-NoProfile", "-NonInteractive", "-STA",
        "-ExecutionPolicy", "Bypass", "-File", helper, "-Mode", "Host",
        "-Port", String(port), "-BasePath", basePath, "-BackendPid", String(process.pid)
      ], { windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
      let output = "";
      let error = "";
      let settled = false;
      const timeout = setTimeout(() => {
        settled = true;
        reject(new Error(`Notification activator startup timeout: ${error}`));
      }, 20000);
      activationHost.stdout.on("data", chunk => {
        output += chunk.toString();
        if (!settled && output.includes("NOTIFICATION_HOST_READY")) {
          settled = true;
          clearTimeout(timeout);
          resolve();
        }
      });
      activationHost.stderr.on("data", chunk => { error += chunk.toString(); });
      activationHost.on("error", reject);
      activationHost.on("exit", code => {
        clearTimeout(timeout);
        if (!settled) reject(new Error(`Notification activator exited ${code}: ${error}`));
        ready = null;
        event("host-exit", { code, error: error.slice(-1000) });
      });
    });
    return ready;
  }

  // Structured arguments carry base64 UTF-8 JSON; PowerShell never parses
  // notification text, replies, or paths as executable command text.
  function adapter(mode, payload) {
    return new Promise((resolve, reject) => {
      execFile("powershell.exe", [
        "-NoLogo", "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass",
        "-File", helper, "-Mode", mode, "-Port", String(port), "-BasePath", basePath,
        "-PayloadBase64", Buffer.from(JSON.stringify(payload), "utf8").toString("base64")
      ], { windowsHide: true, timeout: 15000, encoding: "utf8" }, (error, stdout, stderr) => {
        if (error) return reject(new Error(String(stderr || error.message).trim()));
        try { resolve(JSON.parse(stdout.trim() || "{}")); }
        catch { reject(new Error(`Invalid Windows notification response: ${stdout}`)); }
      });
    });
  }

  function soundFile(sound) {
    if (sound === "none") return null;
    const name = sound === "classic" ? "codex-classic.wav" : "codex-notification.wav";
    // Reuse official audio without depending on the official application running.
    const explicit = process.env[`CODEX_${name.replaceAll("-", "_").toUpperCase()}`];
    if (explicit && fs.existsSync(explicit)) return explicit;
    // WindowsApps can deny root enumeration while allowing the installed
    // package's exact resource path. Reuse the running CLI's package first.
    if (soundDirectory) {
      const installed = path.join(soundDirectory, name);
      if (fs.existsSync(installed)) return installed;
    }
    try {
      const directory = "C:\\Program Files\\WindowsApps";
      for (const candidate of fs.readdirSync(directory).filter(n => /^OpenAI\.Codex_/i.test(n)).sort().reverse()) {
        const file = path.join(directory, candidate, "app", "resources", name);
        if (fs.existsSync(file)) return file;
      }
    } catch {}
    return null;
  }

  function approvalResult(message, action) {
    const accepted = action === "approve" || action === "approve-for-session";
    if (message.method === "mcpServer/elicitation/request") {
      if (!canApproveMcpTool(message)) throw new Error("This elicitation must be answered in the browser");
      if (action === "approve-for-session" && !message.params._meta?.persist?.includes("session")) {
        throw new Error("Session approval is unavailable");
      }
      // Match the official frontend's qf helper: MCP uses action/content/_meta,
      // not command decision or a permission profile. Never grant permanently.
      return {
        action: accepted ? "accept" : "decline",
        content: accepted ? {} : null,
        _meta: action === "approve-for-session" ? { persist: "session" } : null
      };
    }
    if (message.method === "item/permissions/requestApproval") {
      return {
        permissions: accepted ? message.params.permissions || {} : {},
        scope: action === "approve-for-session" ? "session" : "turn"
      };
    }
    if (!permissionMethods.has(message.method)) throw new Error("This request has no approval buttons");
    // Do not invent a session decision that the server did not offer.
    let decision = accepted ? action === "approve-for-session" ? "acceptForSession" : "accept" : "decline";
    const available = message.params.availableDecisions;
    if (available && !available.includes(decision)) {
      if (decision === "acceptForSession" && available.includes("accept")) decision = "accept";
      else if (decision === "decline" && available.includes("cancel")) decision = "cancel";
      else throw new Error("Approval decision is unavailable");
    }
    return { decision };
  }

  async function publish(notification) {
    if (!policy(notification.kind, notification.conversationId)) {
      event("suppressed", { id: notification.id, kind: notification.kind });
      return { shown: false, suppressed: true };
    }
    if (records.has(notification.id)) return { shown: true, deduplicated: true };
    const record = {
      id: notification.id, notification, token: randomUUID(), createdAt: Date.now(),
      tag: createHash("sha256").update(notification.id).digest("hex").slice(0, 16)
    };
    records.set(record.id, record);
    if (records.size > 200) records.delete(records.keys().next().value);
    try {
      await startHost();
      // A response might resolve while the native adapter is still starting.
      if (notification.requestId != null && !getPending(notification.requestId)) {
        records.delete(record.id);
        return { shown: false, resolved: true };
      }
      const settings = readSettings();
      const result = await adapter("Show", {
        ...notification, tag: record.tag, id: record.id, token: record.token,
        sound: settings["notifications-sound"] || "default",
        soundPath: soundFile(settings["notifications-sound"] || "default")
      });
      record.shown = Boolean(result.shown);
      event("shown", { id: record.id, kind: notification.kind, threadId: notification.conversationId,
        requestId: notification.requestId, result });
      return { ...result, notificationId: record.id };
    } catch (error) {
      records.delete(record.id);
      event("show-error", { id: record.id, error: error.message });
      throw error;
    }
  }

  async function hide(payload = {}) {
    const matching = [...records.values()].filter(record =>
      record.id === payload.notificationId || record.tag === payload.tag ||
      record.notification.conversationId === payload.conversationId);
    await Promise.all(matching.map(record => adapter("Hide", { tag: record.tag })));
    // Dismissal does not delete the action registry. A click already queued
    // by Windows must still be able to resolve the precise pending request.
    return { hidden: true };
  }

  async function action(payload) {
    const record = records.get(payload.id);
    if (!record || payload.token !== record.token) throw new Error("Notification action is stale or invalid");
    const notification = record.notification;
    const threadId = notification.conversationId;
    const openUrl = `http://127.0.0.1:${port}${basePath}local/${encodeURIComponent(threadId || "")}`;
    const type = payload.type || "open";
    if (type === "open") return { openUrl };
    if (type === "reply") {
      if (!payload.reply?.trim()) throw new Error("Reply is empty");
      event("reply", { id: record.id, threadId });
      return { reply: payload.reply.trim(), threadId, openUrl };
    }
    if (!["approve", "approve-for-session", "decline"].includes(type)) throw new Error("Unknown notification action");
    const pending = getPending(notification.requestId);
    if (!pending || pending.params?.threadId !== threadId) throw new Error("Approval has already been resolved");
    // Bind generated actions to the original method and turn as well as id.
    // A stale toast must not resolve a later request reusing the same id.
    if (notification.requestMethod && (pending.method !== notification.requestMethod ||
        pending.params?.turnId !== notification.turnId)) throw new Error("Approval request has changed");
    const result = approvalResult(pending, type);
    // Use the server's id and method; never choose a request by thread or button order.
    respond(pending.id, result);
    await hide({ notificationId: record.id });
    event("approval-action", { id: record.id, requestId: pending.id, type, result });
    return { resolved: true };
  }

  function rememberThread(thread) {
    if (thread?.id) threads.set(thread.id, { name: thread.name, source: thread.source });
    if (threads.size > 500) threads.delete(threads.keys().next().value);
  }

  function onRequest(message) {
    const elicitation = message.method === "mcpServer/elicitation/request";
    const mcpApproval = isMcpToolApproval(message);
    const permission = permissionMethods.has(message.method) || mcpApproval;
    if (!permission && !elicitation && message.method !== "item/tool/requestUserInput") return;
    const p = message.params;
    const available = p.availableDecisions;
    // MCP metadata, not availableDecisions, advertises persistence options.
    // Rich elicitations still notify, but only opening their browser UI is safe.
    const nativeApproval = mcpApproval ? canApproveMcpTool(message) : permission;
    const sessionApproval = mcpApproval
      ? Array.isArray(p._meta?.persist) && p._meta.persist.includes("session")
      : !available || available.includes("acceptForSession");
    const actions = nativeApproval ? [
      { title: mcpApproval ? "Allow once" : "Approve", actionType: "approve" },
      ...(sessionApproval ? [{ title: "Approve for session", actionType: "approve-for-session" }] : []),
      { title: "Decline", actionType: "decline" }
    ] : [];
    // Permission-profile grants need their profile forwarded, not a command decision.
    const titles = {
      "item/commandExecution/requestApproval": "Command approval",
      "item/fileChange/requestApproval": "File edit approval",
      "item/permissions/requestApproval": "Permission approval",
      "mcpServer/elicitation/request": mcpApproval ? `MCP approval: ${p.serverName}` : "Need your input"
    };
    const toolParams = mcpApproval ? p._meta?.tool_params : null;
    const detail = toolParams ? `\n${JSON.stringify(toolParams)}` : "";
    return publish({
      id: `${permission ? "approval" : "question"}-local-${message.id}`,
      kind: permission ? "permission" : "question",
      title: titles[message.method] || threads.get(p.threadId)?.name || "Need your input",
      body: (p.reason || p.message || (permission ? "Approval required" : "Answer a question to proceed.")) +
        detail,
      conversationId: p.threadId, requestId: message.id, actions,
      requestMethod: message.method, turnId: p.turnId
    }).catch(() => {});
  }

  function onEvent(message) {
    const p = message.params || {};
    if (message.method === "thread/started") rememberThread(p.thread);
    if (message.method === "thread/name/updated") {
      threads.set(p.threadId, { ...threads.get(p.threadId), name: p.threadName });
    }
    if (message.method === "serverRequest/resolved") {
      hide({ notificationId: `approval-local-${p.requestId}` }).catch(error => event("hide-error", { error: error.message }));
      hide({ notificationId: `question-local-${p.requestId}` }).catch(() => {});
    }
    const key = `${p.threadId}:${p.turnId || p.turn?.id}`;
    if (message.method === "item/completed" && p.item?.type === "agentMessage") {
      turns.set(key, p.item.text);
      if (turns.size > 100) turns.delete(turns.keys().next().value);
    }
    if (message.method !== "turn/completed") return;
    const body = [...(p.turn.items || [])].reverse().find(item => item.type === "agentMessage")?.text || turns.get(key);
    turns.delete(key);
    // Match official quiet turns and avoid treating interrupted work as success.
    if (p.turn.status !== "completed" || p.hasPendingContinuation ||
        p.automationNotificationDecision === "DONT_NOTIFY") return;
    publish({
      id: `turn-local-${key}`, kind: "turn-complete",
      title: threads.get(p.threadId)?.name || "Turn complete",
      body: body?.trim() || "ChatGPT finished a turn.",
      conversationId: p.threadId, replyPlaceholder: "Reply to ChatGPT"
    }).catch(() => {});
  }

  return {
    presence, onRequest, onEvent, rememberThread, publish, hide, action,
    status: () => ({
      appId, settings: readSettings(), clients: [...clients.values()],
      notifications: [...records.values()], events: recent
    }),
    close: () => activationHost?.kill()
  };
}

module.exports = { createDesktopNotifications };
