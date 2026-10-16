function adaptFilePreviews(source) {
  // Desktop file mentions default to external applications. Browser clients
  // instead use the existing official panel, including its artifact renderers.
  const original = "O=x!==void 0&&x,k=jr(zb)";
  if (source.split(original).length !== 2) {
    throw new Error("Packaged file-preview entry signature changed");
  }
  // Folder reveal and modified clicks retain their original earlier branches.
  const mediaOriginal = 'function Ixn(e){return`${zxn}${Rxn(e)}`}';
  if (source.split(mediaOriginal).length !== 2) {
    throw new Error("Packaged media-preview entry signature changed");
  }
  // Electron's app://fs protocol is unavailable in a regular browser. Keep
  // the official media UI and stream through the authenticated file endpoint.
  const mediaReplacement = 'function Ixn(e){return window.__codexBrowserPaths.publicPath(`/__bridge/local-file?path=${encodeURIComponent(e)}`)}';
  return source.replace(original, "O=!0,k=jr(zb)")
    .replace(mediaOriginal, mediaReplacement);
}

module.exports = { adaptFilePreviews };
