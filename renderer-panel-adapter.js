function adaptRightPanel(source) {
  // Hook the verified app-shell lifecycle, where the real panel-open state,
  // target workspace width, scope, and button handler are available together.
  const original = "pt=ta(e=>{f(e),ft(e),e??i.set(_At,null)});return bpe(Ae";
  const effect = `(0,iq.useLayoutEffect)(()=>{
    let frame=null;
    const sync=()=>{
      frame=null;
      window.__codexBrowserRightPanelPolicy?.({
        scope:i,isOpen:D,isFullWidth:i.get(kI),allowFullWidth:i.get(rra),
        workspaceWidth:Be.get(),setFullWidth:full=>era(i,full)
      });
    };
    const schedule=()=>{if(frame===null)frame=requestAnimationFrame(sync)};
    schedule();
    const unsubscribe=Be.on("change",schedule);
    return()=>{unsubscribe();if(frame!==null)cancelAnimationFrame(frame)};
  },[i,D,j,Be]);`;
  // Dispatch on the next frame, outside React's lifecycle, since the official
  // era handler uses flushSync. Observe target width, not its spring animation.
  if (source.split(original).length !== 2) {
    throw new Error("Packaged right-panel lifecycle signature changed");
  }
  return source.replace(original,
    `pt=ta(e=>{f(e),ft(e),e??i.set(_At,null)});${effect}return bpe(Ae`);
}

module.exports = { adaptRightPanel };
