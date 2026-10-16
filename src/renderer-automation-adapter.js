/*
 * Source-level adapter for the optional automation-disabling extension.
 *
 * The packaged renderer is minified, so each replacement is deliberately
 * pinned to a small official signature. A changed official build fails loudly
 * instead of silently leaving part of the scheduled-task UI active.
 */

const AUTOMATION_CAPABILITIES = [
  "automations.local",
  "automations.cloud",
  "automations.cloud.scheduled-tasks",
  "scheduled-tasks",
  "local-automations",
  "cloud-automations"
];

function replaceOnce(source, original, replacement, label) {
  const count = source.split(original).length - 1;
  if (count !== 1) {
    throw new Error(`Automation adapter signature mismatch for ${label}: ${count}`);
  }
  return source.replace(original, replacement);
}

function adaptAutomationRenderer(source) {
  let adapted = source;

  // The capability selector is the renderer's common source of truth for
  // navigation, command visibility, and automation page eligibility.
  const capabilityStart =
    "aJi=Zqi(tJi),bU=ns(X,(e,{get:t})=>{let n=aJi[e.name];";
  const capabilityReplacement =
    "aJi=Zqi(tJi),bU=ns(X,(e,{get:t})=>{let n=aJi[e.name];" +
    "if(window.__codexBrowserDisableAutomations===!0&&" +
    `${JSON.stringify(AUTOMATION_CAPABILITIES)}.includes(e.name))` +
    "return{isLoading:!1,isError:!1,isCapable:!1};";
  adapted = replaceOnce(
    adapted,
    capabilityStart,
    capabilityReplacement,
    "capability selector"
  );

  // Disable the two local query families before their query functions can
  // reach the bridge. This removes both initial fetches and minute polling.
  adapted = replaceOnce(
    adapted,
    "dF=a_(X,`list-automations`,{enabled:!0,refetchInterval:_.ONE_MINUTE,staleTime:_.ONE_MINUTE})",
    "dF=a_(X,`list-automations`,{enabled:!1,refetchInterval:!1,staleTime:_.ONE_MINUTE})",
    "local automation polling"
  );
  adapted = replaceOnce(
    adapted,
    "qJr=a_(X,`inbox-items`,{enabled:!0,params:{limit:200},refetchInterval:_.ONE_MINUTE,staleTime:_.FIVE_SECONDS})",
    "qJr=a_(X,`inbox-items`,{enabled:!1,params:{limit:200},refetchInterval:!1,staleTime:_.FIVE_SECONDS})",
    "sidebar inbox polling"
  );
  adapted = replaceOnce(
    adapted,
    "xWr=a_(X,`inbox-items`,{enabled:!0,params:{limit:200},refetchInterval:_.ONE_MINUTE,staleTime:_.ONE_MINUTE})",
    "xWr=a_(X,`inbox-items`,{enabled:!1,params:{limit:200},refetchInterval:!1,staleTime:_.ONE_MINUTE})",
    "automation inbox polling"
  );

  // Cloud automation queries share this account-id gate. Returning null
  // preserves the normal disabled-query path without touching account state.
  const cloudAccountStart =
    "yU=ls(X,({get:e})=>{let t=e(Kg);return t.status===`allowed`?";
  const cloudAccountReplacement =
    "yU=ls(X,({get:e})=>{if(window.__codexBrowserDisableAutomations===!0)return null;" +
    "let t=e(Kg);return t.status===`allowed`?";
  adapted = replaceOnce(
    adapted,
    cloudAccountStart,
    cloudAccountReplacement,
    "cloud automation query gate"
  );

  // The local scheduler host service is a renderer-side capability handshake.
  // Skip it entirely so disabling the extension does not create a host request.
  const schedulerStart =
    "function tcc(){let e=(0,rcc.c)(4),t;";
  const schedulerReplacement =
    "function tcc(){if(window.__codexBrowserDisableAutomations===!0)return null;" +
    "let e=(0,rcc.c)(4),t;";
  adapted = replaceOnce(
    adapted,
    schedulerStart,
    schedulerReplacement,
    "local scheduler capability handshake"
  );

  // Direct visits and legacy /inbox links must leave the feature surface
  // without lazy-loading the scheduled-task page.
  const routeStart =
    "new URLSearchParams(r);let o;e[0]===Symbol.for(`react.memo_cache_sentinel`)?";
  const routeReplacement =
    "new URLSearchParams(r);if(window.__codexBrowserDisableAutomations===!0&&" +
    "(n===`/automations`||n===`/scheduled`||n.startsWith(`/automations/`)))" +
    "return(0,T5.jsx)(_d,{to:`/`,replace:!0});let o;" +
    "e[0]===Symbol.for(`react.memo_cache_sentinel`)?";
  adapted = replaceOnce(adapted, routeStart, routeReplacement, "automation route guard");

  adapted = replaceOnce(
    adapted,
    "(0,T5.jsx)(yd,{path:`/inbox`,element:(0,T5.jsx)(_d,{to:`/automations`,replace:!0})})",
    "(0,T5.jsx)(yd,{path:`/inbox`,element:(0,T5.jsx)(_d,{to:`/`,replace:!0})})",
    "inbox route redirect"
  );

  // Remove the command-palette entry itself, rather than leaving a command
  // that can navigate into a deliberately disabled route.
  adapted = replaceOnce(
    adapted,
    "[`manageTasks`,oBr],",
    "",
    "manage tasks command"
  );

  // Restored right-panel tabs and activity filters are separate entry points
  // from the sidebar route. Keep their official availability contract false.
  adapted = replaceOnce(
    adapted,
    "IPs={durableRoute:{version:1},isAvailable:()=>!0,kind:kPs}",
    "IPs={durableRoute:{version:1},isAvailable:()=>window.__codexBrowserDisableAutomations!==!0,kind:kPs}",
    "automation side panel"
  );
  adapted = replaceOnce(
    adapted,
    "I=(0,i6.jsx)(i6.Fragment,{children:(0,i6.jsx)(uo.CheckboxItem,{checked:f,onCheckedChange:P,children:F})})",
    "I=window.__codexBrowserDisableAutomations===!0?null:(0,i6.jsx)(i6.Fragment,{children:(0,i6.jsx)(uo.CheckboxItem,{checked:f,onCheckedChange:P,children:F})})",
    "scheduled activity filter"
  );

  // Clearing ordinary unread chats must not send an inbox write as a side
  // effect. Both callers share this exact dispatch signature.
  const markRead = "Jn.dispatchMessage(`inbox-automation-runs-mark-all-read`,{readAt:";
  if (adapted.split(markRead).length !== 3) {
    throw new Error("Automation adapter signature mismatch for mark-all-read");
  }
  adapted = adapted.replaceAll(markRead,
    "window.__codexBrowserDisableAutomations!==!0&&" + markRead);

  return adapted;
}

module.exports = {
  AUTOMATION_CAPABILITIES,
  adaptAutomationRenderer
};
