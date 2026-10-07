// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: isSessionWakeParams  (minified: aR, daemon.pretty.js:31568)
// name: INFERRED — upstream's own spelling, confirmed against the published source @openduo/protocol@0.8.4 system.ts (maps/published_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isSessionWakeParams(e) {
    return !(!isRecord(e) || typeof e.session_key != "string" || e.session_key.trim().length === 0 || typeof e.when != "string" || e.when.trim().length === 0 || typeof e.context != "string" || e.context.trim().length === 0)
}
