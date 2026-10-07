// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: isSessionCompactParams  (minified: dR, daemon.pretty.js:31584)
// name: INFERRED — upstream's own spelling, confirmed against the published source @openduo/protocol@0.8.4 system.ts (maps/published_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isSessionCompactParams(e) {
    return !(!isRecord(e) || typeof e.target != "string" || e.target.trim().length === 0 || e.source !== void 0 && typeof e.source != "string")
}
