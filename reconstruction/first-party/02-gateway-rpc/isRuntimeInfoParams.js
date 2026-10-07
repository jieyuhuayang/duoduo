// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: isRuntimeInfoParams  (minified: rR, daemon.pretty.js:31545)
// name: INFERRED — upstream's own spelling, confirmed against the published source @openduo/protocol@0.8.4 system.ts (maps/published_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isRuntimeInfoParams(e) {
    if (e == null) return !0;
    if (!isRecord(e)) return !1;
    let t = Object.keys(e);
    return t.length === 0 ? !0 : t.length === 1 && t[0] === "source_kind" || "source_kind" in e && e.source_kind !== void 0 ? typeof e.source_kind == "string" : !0
}
