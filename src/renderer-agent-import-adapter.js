/*
 * Disable the private external-agent import query sources before mounting.
 * Each pinned signature must match exactly once when the frontend is upgraded.
 * The official blocked-import atom hides settings/onboarding/command UI.
 */
function replaceOnce(source, original, replacement, label) {
  const count = source.split(original).length - 1;
  if (count !== 1) throw new Error(`Agent import adapter signature mismatch for ${label}: ${count}`);
  return source.replace(original, replacement);
}

function adaptAgentImportRenderer(source) {
  const enabled = "window.__codexBrowserDisableAgentImport!==!0";
  let result = replaceOnce(source, "k1=Go(X,()=>null)",
    "k1=Go(X,()=>window.__codexBrowserDisableAgentImport===!0?!0:null)", "blocked-import atom");
  // History queries use CLI RPC, whereas status/connector queries use host fetch.
  // Disable both at their query descriptors without altering model-visible tools.
  for (const [name, start] of [
    ["IKo", "IKo=$r(X,(e,{scope:t})=>({queryKey:"],
    ["LKo", "LKo=$r(X,(e,{scope:t})=>({queryKey:"],
    ["RKo", "RKo=$r(X,(e,{scope:t})=>({queryKey:"],
    ["zKo", "zKo=o_(X,`external-agent-import-status`,e=>({params:"],
    ["BKo", "BKo=o_(X,`external-agent-import-status`,({hostId:e,providers:t})=>({params:"]
  ]) {
    const boundary = start.lastIndexOf("({") + 2;
    result = replaceOnce(result, start,
      `${start.slice(0, boundary)}enabled:${enabled},${start.slice(boundary)}`, `${name} query`);
  }
  result = replaceOnce(result, "Jqo=o_(X,qqo,e=>({enabled:!0,",
    `Jqo=o_(X,qqo,e=>({enabled:${enabled},`, "imported connectors");
  result = replaceOnce(result, "T={enabled:w,refetchOnMount:!0,staleTime:0}",
    `T={enabled:w&&${enabled},refetchOnMount:!0,staleTime:0}`, "dialog status query");
  // An imperative discovery call must not silently pretend no imports were found.
  const discovery = "async function Lqo({cache:e=!1,detectionId:t,hostId:n,includeHome:r,providers:i,sessionLimits:a,workspaceRoots:o}){";
  result = replaceOnce(result, discovery, discovery +
    "if(window.__codexBrowserDisableAgentImport===!0)throw Object.assign(" +
    "Error(`External agent import is disabled`),{code:`FRONTEND_EXTENSION_DISABLED`});",
    "imperative detection");
  return result;
}

module.exports = { adaptAgentImportRenderer };
