// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: isNonEmptyText  (minified: $8e, daemon.pretty.js:31600)
// name: INFERRED — upstream's own spelling, confirmed against the published source @openduo/protocol@0.8.4 system.ts (maps/published_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isNonEmptyText(e) {
    return typeof e == "string" && e.trim().length > 0
}
