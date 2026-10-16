function replaceExact(source, original, replacement) {
  // Match the pinned build once; upgrades must never silently skip an attachment patch.
  if (source.split(original).length !== 2) {
    throw new Error("Packaged attachment entry signature changed");
  }
  return source.replace(original, replacement);
}

function adaptAttachmentInitial(source) {
  source = replaceExact(source,
    "let r=t.clipboardData,{files:i,imageFiles:o,otherFiles:s}=zFa(r)",
    "let r=t.clipboardData,{files:i,imageFiles:o,otherFiles:s}=zFa(window.__codexBrowserAttachments.snapshotTransfer(r))");
  // Empty documents are real attachments too, not evidence of a missing paste payload.
  source = replaceExact(source, "if(a.size!==0){if(Lr(a))", "if(a.size>=0){if(Lr(a))");
  // Keep the official registry, CLI writes, cleanup and pending-attachment lifecycle.
  return replaceExact(source,
    "async createBlob(e,t){return this.createBase64(",
    "async createBlob(e,t){window.__codexBrowserAttachments.validateFile(e);return this.createBase64(");
}

function adaptAttachmentPrimary(source) {
  source = replaceExact(source,
    "canCopyBrowserFileAttachments:!1,composerMode:at",
    "canCopyBrowserFileAttachments:!0,composerMode:at");
  // Browser blobs are already in this renderer; do not use Electron's chunked IPC staging.
  source = replaceExact(source,
    "w=t=>Ert(e,t,{copyFromLocalFile:r})",
    "w=t=>Ert(e,t,{copyFromLocalFile:!1})");
  // The desktop fallback also ignores zero-byte browser files before uploading them.
  source = replaceExact(source,
    "n.filter(e=>e.size>0&&Aie(e,d)==null)",
    "n.filter(e=>e.size>=0&&Aie(e,d)==null)");
  source = replaceExact(source,
    "onPickBrowserFiles:void 0,setFileAttachments:Vi",
    "onPickBrowserFiles:ya.pickBrowserFileDescriptors,setFileAttachments:Vi");
  source = replaceExact(source,
    "let{files:t}=Use(e.clipboardData)",
    "let{files:t}=Use(window.__codexBrowserAttachments.snapshotTransfer(e.clipboardData))");
  const picker = 'function wrt({accept:e,allowMultiple:t=!0,imagesOnly:n}={}){return new Promise(r=>{let i=document.createElement(`input`);i.type=`file`,i.multiple=t,(e!=null||n)&&(i.accept=e?.join(`,`)??`image/*`),i.style.position=`fixed`,i.style.opacity=`0`,i.style.pointerEvents=`none`,i.style.width=`1px`,i.style.height=`1px`;let a=e=>{i.remove(),r(e)};i.addEventListener(`change`,()=>{a(i.files==null?[]:Array.from(i.files))},{once:!0}),i.addEventListener(`cancel`,()=>{a([])},{once:!0}),(document.body??document.documentElement).append(i),i.click()})}';
  source = replaceExact(source, picker,
    "function wrt(e={}){return window.__codexBrowserAttachments.pickFiles(e)}");
  // The official image preview otherwise settles before its asynchronous disk write.
  return replaceExact(source,
    "x(async e=>({id:e,src:await Ru(u),filename:f}),{orderKey:l?.get(u)",
    "x(async e=>({id:e,src:await Ru(u),filename:f,localPath:await window.__codexBrowserAttachments.requireImagePath(g)}),{orderKey:l?.get(u)");
}

module.exports = { adaptAttachmentInitial, adaptAttachmentPrimary };
