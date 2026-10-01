const LOCK_TTL_MS = 120000;
const SENT_MESSAGE_TTL_MS = 600000;
const ENDPOINT = "/__bridge/queued-follow-up-send-lock/";

// Readable migration of Vee from the pinned renderer's main-BR_2NHW6.js.
// Preserve the desktop lease and deduplication rules, not a renderer-local lock.
class QueuedFollowUpSendLocks {
  startingTurns = new Set();
  activeLocks = new Map();
  sentMessages = new Map();

  constructor(now = Date.now) {
    this.now = now;
  }

  tryAcquireStartTurn(conversationId) {
    // This separate guard is retained from the official class for parity.
    if (this.startingTurns.has(conversationId)) return false;
    this.startingTurns.add(conversationId);
    return true;
  }

  releaseStartTurn(conversationId) {
    this.startingTurns.delete(conversationId);
  }

  tryAcquire({ conversationId, messageId, lockId }) {
    const now = this.now();
    this.deleteExpiredSentMessages(now);
    // A successful send is remembered even after its active lease is released.
    if (this.sentMessages.has(this.getSentMessageKey(conversationId, messageId))) return false;
    const active = this.activeLocks.get(conversationId);
    if (active != null && active.expiresAtMs > now) return false;
    this.activeLocks.set(conversationId, { lockId, expiresAtMs: now + LOCK_TTL_MS });
    return true;
  }

  release({ conversationId, messageId, lockId, sent }) {
    // An expired holder cannot release the replacement holder's lease.
    if (this.activeLocks.get(conversationId)?.lockId === lockId) {
      this.activeLocks.delete(conversationId);
    }
    // Retain successful-send deduplication even for a late official release.
    if (sent) {
      this.sentMessages.set(this.getSentMessageKey(conversationId, messageId),
        this.now() + SENT_MESSAGE_TTL_MS);
    }
  }

  getSentMessageKey(conversationId, messageId) {
    return `${conversationId}\n${messageId}`;
  }

  deleteExpiredSentMessages(now) {
    for (const [key, expiresAtMs] of this.sentMessages) {
      if (expiresAtMs <= now) this.sentMessages.delete(key);
    }
  }
}

function validatePayload(payload, operation) {
  // Only identifiers cross this adapter; message contents never enter the lock.
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Send lock payload must be an object");
  }
  for (const field of ["conversationId", "messageId", "lockId"]) {
    const value = payload[field];
    if (typeof value !== "string" || !value.trim() ||
        value.length > 1024 || /[\r\n]/.test(value)) {
      throw new Error(`Invalid send lock ${field}`);
    }
  }
  if (operation === "release" && typeof payload.sent !== "boolean") {
    throw new Error("Send lock release requires a boolean sent value");
  }
}

function createQueuedFollowUpSendLockHandler(locks = new QueuedFollowUpSendLocks()) {
  // One handler instance is shared by the loopback and LAN HTTP listeners.
  return function handleSendLock(request, response, pathname) {
    if (!pathname.startsWith(ENDPOINT)) return false;
    const send = (status, body) => {
      response.writeHead(status, {
        "content-type": "application/json; charset=utf-8", "cache-control": "no-store",
        ...(status === 405 ? { allow: "POST" } : {})
      });
      response.end(JSON.stringify(body));
    };
    const operation = pathname.slice(ENDPOINT.length);
    if (!["acquire", "release"].includes(operation)) {
      send(404, { error: "Unknown send lock operation" });
      return true;
    }
    if (request.method !== "POST") {
      send(405, { error: "Send lock operations require POST" });
      return true;
    }
    const chunks = [];
    let bytes = 0;
    let tooLarge = false;
    request.on("data", chunk => {
      bytes += chunk.length;
      // Drain oversized requests without keeping their body or changing lock state.
      if (bytes > 8192) {
        tooLarge = true;
        chunks.length = 0;
      } else if (!tooLarge) chunks.push(chunk);
    });
    request.on("end", () => {
      if (tooLarge) return send(413, { error: "Send lock payload is too large" });
      try {
        const payload = JSON.parse(Buffer.concat(chunks).toString("utf8"));
        validatePayload(payload, operation);
        if (operation === "acquire") {
          send(200, { acquired: locks.tryAcquire(payload) });
        } else {
          locks.release(payload);
          // The official release caller waits for completion but consumes no fields.
          send(200, {});
        }
      } catch (error) {
        send(400, { error: String(error.message) });
      }
    });
    return true;
  };
}

module.exports = { QueuedFollowUpSendLocks, createQueuedFollowUpSendLockHandler };
