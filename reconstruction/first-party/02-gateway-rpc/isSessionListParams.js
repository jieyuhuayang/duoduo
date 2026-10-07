// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: isSessionListParams  (minified: oR, daemon.pretty.js:31560)
// name: INFERRED — upstream's own spelling, confirmed against the published source @openduo/protocol@0.8.4 system.ts (maps/published_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isSessionListParams(e) {
    return e == null ? !0 : !(!isRecord(e) || e.kind !== void 0 && !isSessionListKind(e.kind) || e.named_only !== void 0 && typeof e.named_only != "boolean" || e.include_orphans !== void 0 && typeof e.include_orphans != "boolean" || e.deliverable !== void 0 && typeof e.deliverable != "boolean")
}
