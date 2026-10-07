// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: isSpineTailParams  (minified: OR, daemon.pretty.js:31774)
// name: INFERRED — upstream's own spelling, confirmed against the published source @openduo/protocol@0.8.4 dashboard.ts (maps/published_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isSpineTailParams(e) {
    return e == null ? !0 : !(!isRecord(e) || e.limit !== void 0 && typeof e.limit != "number" || e.after_id !== void 0 && typeof e.after_id != "string")
}
