// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: isSessionEffortParams  (minified: cR, daemon.pretty.js:31580)
// name: INFERRED — upstream's own spelling, confirmed against the published source @openduo/protocol@0.8.4 system.ts (maps/published_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isSessionEffortParams(e) {
    return !isRecord(e) || typeof e.session_key != "string" || e.session_key.trim().length === 0 || Object.keys(e).some(t => t !== "session_key" && t !== "effort") ? !1 : Object.hasOwn(e, "effort") ? e.effort === null || typeof e.effort == "string" && isEffortLevel(e.effort) : !0
}
