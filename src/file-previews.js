const fs = require("node:fs");
const path = require("node:path");

// Match the official artifact reader limit; downloads still stream larger files.
const PREVIEW_MAX_BYTES = 40 * 1024 * 1024;
const previewMime = {
  ".htm": "text/html; charset=utf-8", ".html": "text/html; charset=utf-8",
  ".pdf": "application/pdf", ".svg": "image/svg+xml",
  ".png": "image/png", ".webp": "image/webp", ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg", ".gif": "image/gif", ".bmp": "image/bmp",
  ".avif": "image/avif", ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8", ".md": "text/plain; charset=utf-8",
  ".csv": "text/csv; charset=utf-8", ".tsv": "text/tab-separated-values; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".ipynb": "application/json; charset=utf-8",
  ".xml": "text/xml; charset=utf-8",
  ".aac": "audio/aac", ".flac": "audio/flac", ".m4a": "audio/mp4",
  ".mp3": "audio/mpeg", ".mp4a": "audio/mp4", ".oga": "audio/ogg",
  ".ogg": "audio/ogg", ".opus": "audio/ogg", ".wav": "audio/wav",
  ".mp4": "video/mp4", ".ogv": "video/ogg", ".webm": "video/webm",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".xlsm": "application/vnd.ms-excel.sheet.macroEnabled.12",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

// Serve source files as readable text, not executable JavaScript or downloads.
for (const ext of ["c", "h", "cpp", "hpp", "rs", "py", "java", "go", "js",
  "mjs", "ts", "tsx", "jsx", "yaml", "yml", "toml", "log", "tex", "sh", "ps1"]) {
  previewMime[`.${ext}`] = "text/plain; charset=utf-8";
}

function textSample(bytes) {
  if (bytes.includes(0)) return false;
  try {
    // Sampling can split a valid UTF-8 character at the end of the buffer.
    new TextDecoder("utf-8", { fatal: true }).decode(bytes, { stream: true });
    return true;
  } catch {
    return false;
  }
}

function fileMetadata(target, contentSampleByteLimit = 4096) {
  const stat = fs.statSync(target);
  const mimeType = previewMime[path.extname(target).toLowerCase()] || "application/octet-stream";
  let contentKind = null;
  if (stat.isFile()) {
    const kind = mimeType.split("/")[0];
    if (["image", "audio", "video"].includes(kind)) contentKind = kind;
    else if (mimeType === "application/pdf") contentKind = "pdf";
    else {
      // Cap caller-supplied sampling sizes before allocating a buffer.
      const sampleLimit = Number.isSafeInteger(contentSampleByteLimit) && contentSampleByteLimit > 0
        ? Math.min(contentSampleByteLimit, 64 * 1024) : 4096;
      const sample = Buffer.alloc(Math.min(stat.size, sampleLimit));
      const fd = fs.openSync(target, "r");
      try { fs.readSync(fd, sample, 0, sample.length, 0); }
      finally { fs.closeSync(fd); }
      contentKind = textSample(sample) ? "text" : "binary";
    }
  }
  return { isFile: stat.isFile(), isDirectory: stat.isDirectory(), contentKind,
    mimeType, mtimeMs: stat.mtimeMs, sizeBytes: stat.size };
}

function readPreviewFile(target, { representation = "text", maxBytes } = {}) {
  if (!["text", "base64", "blob", "auto"].includes(representation)) {
    throw new Error("unsupported file representation");
  }
  const metadata = fileMetadata(target);
  if (!metadata.isFile) throw new Error("path is not a file");
  // Enforce both the renderer's smaller requested limit and the server ceiling.
  const limit = Number.isSafeInteger(maxBytes) && maxBytes >= 0
    ? Math.min(maxBytes, PREVIEW_MAX_BYTES) : PREVIEW_MAX_BYTES;
  if (metadata.sizeBytes > limit) throw new Error("file exceeds maximum preview size");
  const bytes = fs.readFileSync(target);
  const binary = representation === "base64" || representation === "blob" ||
    (representation === "auto" && metadata.contentKind !== "text");
  return { path: target, name: path.basename(target), size: bytes.length,
    mtimeMs: metadata.mtimeMs, mimeType: metadata.mimeType,
    // Avoid decoding ZIP containers and duplicating binary payloads as UTF-8.
    content: binary ? undefined : bytes.toString("utf8"),
    dataBase64: binary ? bytes.toString("base64") : undefined };
}

function previewByteRange(header, size) {
  if (!header) return null;
  // Only one byte range is needed for native media seeking; reject multipart
  // requests rather than interpreting malformed input as a complete download.
  const match = /^bytes=(\d*)-(\d*)$/.exec(header);
  if (!match || (!match[1] && !match[2]) || size === 0) return false;
  let start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
  let end = match[1] && match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) ||
      start >= size || end < start || (!match[1] && Number(match[2]) === 0)) return false;
  return { start, end };
}

module.exports = { PREVIEW_MAX_BYTES, previewMime, fileMetadata, readPreviewFile, previewByteRange };
