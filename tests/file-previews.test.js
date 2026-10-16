const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { fileMetadata, readPreviewFile, PREVIEW_MAX_BYTES, previewByteRange } = require("../src/file-previews");
const { adaptFilePreviews } = require("../src/renderer-file-adapter");

function fixture(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "codex-preview-test-"));
  // Cleanup is confined to the unique test-owned directory.
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  return (name, bytes) => {
    const target = path.join(directory, name);
    fs.writeFileSync(target, bytes);
    return target;
  };
}

test("metadata exposes the official image, PDF and media kinds", t => {
  const write = fixture(t);
  for (const [name, kind, mimeType] of [
    ["image.svg", "image", "image/svg+xml"],
    ["image.avif", "image", "image/avif"],
    ["sample.pdf", "pdf", "application/pdf"],
    ["sound.mp3", "audio", "audio/mpeg"],
    ["sound.opus", "audio", "audio/ogg"],
    ["movie.webm", "video", "video/webm"],
    ["movie.ogv", "video", "video/ogg"],
  ]) {
    const metadata = fileMetadata(write(name, Buffer.from([0, 255, 1])));
    assert.equal(metadata.contentKind, kind);
    assert.equal(metadata.mimeType, mimeType);
  }
});

test("text sampling handles split UTF-8 and rejects binary contents", t => {
  const write = fixture(t);
  const target = write("source.c", "a\u4e2d");
  // A two-byte sample ends in the middle of the three-byte character.
  assert.equal(fileMetadata(target, 2).contentKind, "text");
  assert.equal(readPreviewFile(target, { representation: "auto" }).content, "a\u4e2d");
  assert.equal(fileMetadata(write("unknown.dat", Buffer.from([1, 0, 2]))).contentKind, "binary");
  assert.equal(fileMetadata(write("invalid.dat", Buffer.from([255, 254]))).contentKind, "binary");
});

test("Office ZIPs use lossless binary reads without a UTF-8 copy", t => {
  const write = fixture(t);
  const bytes = Buffer.from([0x50, 0x4b, 3, 4, 0, 255]);
  for (const name of ["document.docx", "book.xlsx", "macros.xlsm", "slides.pptx"]) {
    const target = write(name, bytes);
    const file = readPreviewFile(target, { representation: "auto" });
    assert.equal(file.content, undefined);
    assert.deepEqual(Buffer.from(file.dataBase64, "base64"), bytes);
    assert.notEqual(file.mimeType, "application/octet-stream");
  }
});

test("requested limits apply before reading and large previews are bounded", t => {
  const write = fixture(t);
  const target = write("small.txt", "1234");
  assert.throws(() => readPreviewFile(target, { maxBytes: 3 }), /maximum preview size/);
  assert.throws(() => readPreviewFile(target, { maxBytes: 0 }), /maximum preview size/);
  assert.equal(readPreviewFile(target, { maxBytes: 4 }).size, 4);
  assert.throws(() => readPreviewFile(target, { representation: "invalid" }), /representation/);
  // A sparse file verifies the ceiling without storing a large fixture.
  fs.truncateSync(target, PREVIEW_MAX_BYTES + 1);
  assert.throws(() => readPreviewFile(target, { maxBytes: PREVIEW_MAX_BYTES * 2 }),
    /maximum preview size/);
});

test("adapter uses the pinned official file panel without modifying runtime files", () => {
  const target = path.resolve(__dirname,
    "../runtime/codex-frontend-26.917.9434/webview/assets/app-initial-fc9a33fdda88.js");
  const original = fs.readFileSync(target, "utf8");
  const adapted = adaptFilePreviews(original);
  assert.ok(adapted.includes("O=!0,k=jr(zb)"));
  assert.ok(original.includes("O=x!==void 0&&x,k=jr(zb)"));
  assert.ok(adapted.includes('window.__codexBrowserPaths.publicPath(`/__bridge/local-file?path='));
  assert.ok(original.includes('function Ixn(e){return`${zxn}${Rxn(e)}`}'));
  assert.throws(() => adaptFilePreviews("unknown build"), /signature changed/);
  assert.throws(() => adaptFilePreviews(original + original), /signature changed/);
});

test("native media byte ranges support seeking, suffixes and HEAD metadata", () => {
  assert.equal(previewByteRange(undefined, 10), null);
  assert.deepEqual(previewByteRange("bytes=2-5", 10), { start: 2, end: 5 });
  assert.deepEqual(previewByteRange("bytes=2-", 10), { start: 2, end: 9 });
  assert.deepEqual(previewByteRange("bytes=-3", 10), { start: 7, end: 9 });
  assert.deepEqual(previewByteRange("bytes=-99", 10), { start: 0, end: 9 });
  assert.deepEqual(previewByteRange("bytes=2-99", 10), { start: 2, end: 9 });
  // Reject invalid and multipart ranges instead of silently serving all bytes.
  for (const range of ["bytes=-0", "bytes=-", "bytes=10-", "bytes=5-2",
    "bytes=0-1,2-3", "items=0-2", "bytes=999999999999999999999-"]) {
    assert.equal(previewByteRange(range, 10), false, range);
  }
  assert.equal(previewByteRange("bytes=0-", 0), false);
});
