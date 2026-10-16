# Browser Attachments

## Sources

Adapted from LibreChat, commit `e1dfc10449ff713faffacd60273fddcfe2c0a698`:

- `packages/client/src/components/FileUpload.tsx`: hidden multiple-file input.
- `client/src/hooks/Input/useTextarea.ts`: synchronous clipboard File snapshots.
- `client/src/hooks/Files/useFileUploadRouter.ts`: shared routing reference.

Repository: https://github.com/danny-avila/LibreChat
License: [MIT notice](licenses/LibreChat-MIT.txt).

The input has been translated from JSX to DOM creation so the adapter does not
add a second React runtime. Clipboard filenames remain unchanged because the
official attachment registry already creates a unique directory for each file.
Cancellation, cleanup and the file-item fallback are local compatibility additions.

Open WebUI was checked as a reference, but no source from that repository is
included in this project.

## Flow

1. The browser picker or paste handler obtains client-side File objects.
2. The official composer creates pending attachment entries.
3. Its existing attachment manager validates the file size, creates a directory,
   and forwards `fs/createDirectory` and `fs/writeFile` to the CLI.
4. The official registry records backend paths; the composer displays attachments.
5. Sending and removal use the original frontend logic.

Ordinary uploads do not need a separate HTTP multipart backend: the exported
frontend already provides a managed file upload path over its CLI transport.
The bridge's image persistence service remains available for the official image
fallback. Images cannot complete attachment creation with only a local preview.

## Compatibility

- Windows: file selection, multiple selection, pasted files/images and file drops.
- Android: standard system file/photo picker; pasted files/images when the browser
  exposes them. No backend-machine dialog or async Clipboard API is required.
- Text-only paste stays in the official editor, including its rich-text behavior.
- Empty files are accepted. The per-file limit is 16 MiB.
- Cancel removes the temporary input; choosing the same file again is supported.
- The official composer generation guard prevents late uploads entering another chat.

Pinned bundle patches are applied when serving assets, not written into runtime
bundles. A mismatched frontend signature fails explicitly and requires an update.
