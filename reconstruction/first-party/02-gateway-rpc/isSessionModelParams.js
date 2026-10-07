// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: isSessionModelParams  (minified: lR, daemon.pretty.js:31576)
// name: INFERRED — upstream's own spelling, confirmed against the published source @openduo/protocol@0.8.4 system.ts (maps/published_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isSessionModelParams(e) {
    return !isRecord(e) || typeof e.session_key != "string" || e.session_key.trim().length === 0 || Object.keys(e).some(t => t !== "session_key" && t !== "model") ? !1 : Object.hasOwn(e, "model") ? e.model === null || typeof e.model == "string" && e.model.length > 0 && !/\s/.test(e.model) : !0
}
