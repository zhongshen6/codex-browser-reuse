const { adaptRightPanel } = require("./renderer-panel-adapter");
const { adaptFilePreviews } = require("./renderer-file-adapter");
const { adaptAttachmentInitial, adaptAttachmentPrimary } = require("./renderer-attachment-adapter");
const { adaptAutomationRenderer } = require("./renderer-automation-adapter");
const { adaptAgentImportRenderer } = require("./renderer-agent-import-adapter");

// These are the deliberately small set of source-level hooks that ordinary
// runtime plugins cannot replace because they need private renderer closures.
const adapters = [
  { group: "plugins", id: "disable-automations", initial: adaptAutomationRenderer },
  { group: "plugins", id: "disable-agent-import", initial: adaptAgentImportRenderer },
  { group: "plugins", id: "right-panel", initial: adaptRightPanel },
  { group: "plugins", id: "file-previews", initial: adaptFilePreviews },
  {
    group: "plugins",
    id: "browser-attachments",
    initial: adaptAttachmentInitial,
    primary: adaptAttachmentPrimary
  }
];

function adaptCoreRenderer(loader, target, source) {
  let adapted = source;
  for (const adapter of adapters) {
    if (!loader.isEnabled(adapter.group, adapter.id)) continue;
    const transform = adapter[target];
    if (transform) adapted = transform(adapted);
  }
  return adapted;
}

module.exports = { adaptCoreRenderer };
