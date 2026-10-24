// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: isSessionCompactParams  (minified: IR, daemon.pretty.js:33666)
// name: INFERRED — upstream's own spelling, confirmed against the published source @openduo/protocol@0.8.4 system.ts (maps/published_daemon.json)
// since: v0.5.8 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 1 renamed — 0 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.8 (medium): `duoduo session compact` — compact a channel session's context on demand.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isSessionCompactParams(params) {
    return !(!isRecord(params) || typeof params.target != "string" || params.target.trim().length === 0 || params.source !== void 0 && typeof params.source != "string")
}
