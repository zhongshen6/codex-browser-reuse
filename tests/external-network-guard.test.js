const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const project = path.resolve(__dirname, "..");
const source = fs.readFileSync(
  path.join(project, "extensions/plugins/external-network-guard/runtime.js"), "utf8"
);

function fixture() {
  const context = vm.createContext({
    location: {
      origin: "http://127.0.0.1:4387",
      href: "http://127.0.0.1:4387/codex/",
      protocol: "http:",
      hostname: "127.0.0.1",
      port: "4387"
    },
    window: {
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent() {}
    },
    URL,
    CustomEvent: class CustomEvent {
      constructor(type, init) {
        this.type = type;
        this.detail = init?.detail;
      }
    }
  });
  vm.runInContext(source, context);
  return context;
}

function networkFixture() {
  const calls = [];
  class FakeXHR {
    open(...args) {
      calls.push(["xhr", args]);
      return "opened";
    }
  }
  class FakeWebSocket {
    constructor(url) {
      calls.push(["websocket", url]);
    }
  }
  class FakeEventSource {
    constructor(url) {
      calls.push(["eventsource", url]);
    }
  }
  const navigator = {
    sendBeacon(url) {
      calls.push(["beacon", url]);
      return true;
    },
    serviceWorker: {
      register(...args) {
        calls.push(["service-worker", args]);
        return Promise.resolve();
      }
    }
  };
  const context = vm.createContext({
    location: {
      origin: "http://127.0.0.1:4387",
      href: "http://127.0.0.1:4387/codex/",
      protocol: "http:",
      hostname: "127.0.0.1",
      port: "4387"
    },
    navigator,
    window: {
      fetch: (...args) => {
        calls.push(["fetch", args]);
        return Promise.resolve("native");
      },
      XMLHttpRequest: FakeXHR,
      WebSocket: FakeWebSocket,
      EventSource: FakeEventSource,
      navigator,
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent() {}
    },
    URL,
    CustomEvent: class CustomEvent {
      constructor(type, init) {
        this.type = type;
        this.detail = init?.detail;
      }
    }
  });
  vm.runInContext(source, context);
  return { context, calls };
}

test("external network guard blocks cross-origin fetches before native fetch", () => {
  const context = fixture();
  const policy = context.window.__codexBrowserExtensionPolicy;
  const blocked = policy.beforeFetchRequest(new URL("https://chatgpt.com/backend-api"));
  assert.equal(blocked.blocked, true);
  assert.equal(blocked.reason, "external-fetch-disabled");
  assert.deepEqual([...blocked.fields], ["https://chatgpt.com", "fetch-policy"]);
  const snapshot = context.window.__codexBrowserExternalNetworkGuard.snapshot();
  assert.equal(snapshot.blockedCount, 1);
  assert.deepEqual({ ...snapshot.origins }, { "https://chatgpt.com": 1 });
  assert.deepEqual({ ...snapshot.channels }, { "fetch-policy": 1 });
});

test("external network guard preserves same-origin and local data requests", () => {
  const context = fixture();
  const policy = context.window.__codexBrowserExtensionPolicy;
  assert.equal(policy.beforeFetchRequest(new URL(
    "http://127.0.0.1:4387/codex/__bridge/status"
  )), null);
  assert.equal(policy.beforeFetchRequest(new URL("data:text/plain,ok")), null);
  assert.equal(policy.beforeFetchRequest(new URL("blob:http://127.0.0.1:4387/id")), null);
  assert.equal(context.window.__codexBrowserExternalNetworkGuard.snapshot().blockedCount, 0);
});

test("external network guard blocks non-fetch channels and restores wrappers", async () => {
  const { context, calls } = networkFixture();
  const { window } = context;
  assert.throws(() => new window.XMLHttpRequest().open(
    "GET", "https://chatgpt.com/backend-api"
  ), /External network access is disabled/);
  assert.throws(() => new window.WebSocket("wss://chatgpt.com/socket"),
    /External network access is disabled/);
  assert.throws(() => new window.EventSource("https://chatgpt.com/events"),
    /External network access is disabled/);
  assert.equal(context.navigator.sendBeacon("https://chatgpt.com/telemetry", "{}"), false);
  assert.equal(typeof context.navigator.serviceWorker.register, "function");
  await assert.rejects(
    context.navigator.serviceWorker.register("/service-worker/events.js"),
    /Service Worker is disabled/
  );
  assert.equal(new window.XMLHttpRequest().open("GET", "/__bridge/status"), "opened");
  assert.equal(new window.WebSocket("ws://127.0.0.1:4387/socket") instanceof
    context.window.WebSocket, true);
  assert.equal(calls.filter(([channel]) => channel === "websocket").length, 1);

  const guard = window.__codexBrowserExternalNetworkGuard;
  guard.dispose();
  assert.equal(window.__codexBrowserExternalNetworkGuard, undefined);
  assert.equal(window.XMLHttpRequest.name, "FakeXHR");
  assert.equal(window.WebSocket.name, "FakeWebSocket");
  assert.equal(context.navigator.serviceWorker.register.name, "register");
});
