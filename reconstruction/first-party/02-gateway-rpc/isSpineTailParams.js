// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: isSpineTailParams  (minified: GR, daemon.pretty.js:33856)
// name: INFERRED — upstream's own spelling, confirmed against the published source @openduo/protocol@0.8.4 dashboard.ts (maps/published_daemon.json)
// since: v0.3.2 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 1 renamed — 0 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.3.2 (high): **protocol**: Add `system.status` RPC (health, sessions, subconscious playlist) and `spine.tail` RPC (last N events with incremental `after_id` cursor and cross-midnight boundary support).
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isSpineTailParams(params) {
    return params == null ? !0 : !(!isRecord(params) || params.limit !== void 0 && typeof params.limit != "number" || params.after_id !== void 0 && typeof params.after_id != "string")
}
