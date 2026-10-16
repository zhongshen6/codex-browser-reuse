const { test } = require("node:test");
const assert = require("node:assert/strict");
const { measureViewport, installViewport } = require("../extensions/plugins/mobile-viewport/runtime");

function fixture() {
  // A controlled visual viewport models browser chrome without a real keyboard.
  const win = new EventTarget();
  Object.assign(win, { innerWidth: 393, innerHeight: 850 });
  win.visualViewport = new EventTarget();
  Object.assign(win.visualViewport, { height: 740, scale: 1 });
  const frames = new Map();
  let sequence = 0;
  // Explicit frame flushing makes burst coalescing and cleanup deterministic.
  win.requestAnimationFrame = callback => { frames.set(++sequence, callback); return sequence; };
  win.cancelAnimationFrame = id => frames.delete(id);
  const properties = new Map();
  const attributes = new Set();
  let writes = 0;
  const doc = {
    documentElement: {
      style: {
        setProperty: (key, value) => { writes += 1; properties.set(key, value); },
        removeProperty: key => { writes += 1; properties.delete(key); }
      },
      toggleAttribute: (key, enabled) => enabled ? attributes.add(key) : attributes.delete(key),
      removeAttribute: key => attributes.delete(key)
    }
  };
  const flush = () => {
    const callbacks = [...frames.values()];
    frames.clear();
    callbacks.forEach(callback => callback());
  };
  return { win, doc, frames, properties, attributes, flush, writes: () => writes };
}

test("global height follows visible mobile area and not the toolbar-covered layout", () => {
  // Keep the outer layout larger than its unobscured view to reproduce the bug.
  const f = fixture();
  const c = installViewport(f.win, f.doc);
  assert.equal(f.properties.get("--codex-browser-viewport-height"), "740px");
  assert.equal(c.getState().compact, false);
  // The same height applies to any renderer route; there are no page checks.
  f.win.visualViewport.height = 360;
  f.win.visualViewport.dispatchEvent(new Event("resize"));
  f.flush();
  assert.equal(f.properties.get("--codex-browser-viewport-height"), "360px");
  assert.equal(f.attributes.has("data-browser-compact-height"), true);
  assert.equal(f.attributes.has("data-browser-very-short-height"), false);
});

test("keyboard close, orientation and very short mobile heights restore correctly", () => {
  // Very-short mode is removed once width/height no longer require it.
  const f = fixture();
  installViewport(f.win, f.doc);
  f.win.visualViewport.height = 260;
  f.win.visualViewport.dispatchEvent(new Event("resize"));
  f.flush();
  assert.equal(f.attributes.has("data-browser-very-short-height"), true);
  f.win.innerWidth = 850;
  f.win.innerHeight = 393;
  f.win.visualViewport.height = 393;
  f.win.dispatchEvent(new Event("resize"));
  f.flush();
  assert.equal(f.properties.get("--codex-browser-viewport-height"), "393px");
  assert.equal(f.attributes.size, 0);
  const landscapePhone = measureViewport({
    innerWidth: 850, innerHeight: 393, matchMedia: () => ({ matches: true })
  });
  assert.equal(landscapePhone.compact, true);
});

test("pinch zoom uses dynamic CSS fallback without relaying zoom as keyboard height", () => {
  // Zoom must not shrink the app to a magnified fraction of the original screen.
  const f = fixture();
  installViewport(f.win, f.doc);
  f.win.visualViewport.scale = 2;
  f.win.visualViewport.height = 370;
  f.win.visualViewport.dispatchEvent(new Event("resize"));
  f.flush();
  assert.equal(f.properties.has("--codex-browser-viewport-height"), false);
  assert.equal(f.attributes.size, 0);
  f.win.visualViewport.scale = 1;
  f.win.visualViewport.height = 740;
  f.win.visualViewport.dispatchEvent(new Event("resize"));
  f.flush();
  assert.equal(f.properties.get("--codex-browser-viewport-height"), "740px");
});

test("desktop and older browsers fall back to valid layout measurements", () => {
  // Ignore invalid visual heights and never exceed the actual layout viewport.
  assert.equal(measureViewport({ innerWidth: 1920, innerHeight: 1080 }).height, 1080);
  assert.equal(measureViewport({ innerWidth: 393, innerHeight: 740,
    visualViewport: { height: 0, scale: 1 } }).height, 740);
  assert.equal(measureViewport({ innerWidth: 393, innerHeight: 740,
    visualViewport: { height: 850, scale: 1 } }).height, 740);
  assert.equal(measureViewport({ innerWidth: 393, innerHeight: 0 }).height, null);
});

test("event bursts schedule once and unchanged measurements do not rewrite CSS", () => {
  const f = fixture();
  installViewport(f.win, f.doc);
  // Scrolling may move the mobile toolbar. Never poll or write on every event.
  for (let i = 0; i < 20; i++) f.win.visualViewport.dispatchEvent(new Event("scroll"));
  assert.equal(f.frames.size, 1);
  f.flush();
  assert.equal(f.writes(), 1);
});

test("reinstallation and disposal remove listeners and pending frame work", () => {
  // Repeated injection is safe and leaves no animation-frame callback behind.
  const f = fixture();
  const first = installViewport(f.win, f.doc);
  f.win.dispatchEvent(new Event("resize"));
  const second = installViewport(f.win, f.doc);
  assert.notEqual(first, second);
  assert.equal(f.frames.size, 0);
  second.dispose();
  f.win.visualViewport.dispatchEvent(new Event("resize"));
  assert.equal(f.frames.size, 0);
  assert.equal(f.properties.size, 0);
  assert.equal(f.win.__codexBrowserViewport, undefined);
});
