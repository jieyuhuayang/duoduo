// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: isSessionArchiveParams  (minified: vR, daemon.pretty.js:33634)
// name: INFERRED — upstream's own spelling, confirmed against the published source @openduo/protocol@0.8.4 system.ts (maps/published_daemon.json)
// since: v0.5.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 1 renamed — 0 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.0 (medium): `session.archive` RPC + `duoduo session archive <session_key>` CLI retired the old ad-hoc deletion paths.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isSessionArchiveParams(params) {
    return !isRecord(params) || typeof params.session_key != "string" ? !1 : params.session_key.length > 0
}
