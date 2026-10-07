// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: isRecord  (minified: at, daemon.pretty.js:31522)
// name: INFERRED — upstream's own spelling, confirmed against the published source @openduo/protocol@0.8.4 rpc.ts (maps/published_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isRecord(e) {
    return !!e && typeof e == "object" && !Array.isArray(e)
}
