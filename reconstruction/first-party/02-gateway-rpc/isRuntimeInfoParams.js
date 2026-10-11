// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: isRuntimeInfoParams  (minified: rR, daemon.pretty.js:31545)
// name: INFERRED — upstream's own spelling, confirmed against the published source @openduo/protocol@0.8.4 system.ts (maps/published_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.2.10 (maps/history_daemon.json)
// locals: 2 renamed — 1 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isRuntimeInfoParams(params) {
    if (params == null) return !0;
    if (!isRecord(params)) return !1;
    let keys = Object.keys(params);
    return keys.length === 0 ? !0 : keys.length === 1 && keys[0] === "source_kind" || "source_kind" in params && params.source_kind !== void 0 ? typeof params.source_kind == "string" : !0
}
