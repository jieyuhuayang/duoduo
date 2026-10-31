// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: isSessionSetAliasParams  (minified: SR, daemon.pretty.js:32760)
// name: INFERRED — upstream's own spelling, confirmed against the published source @openduo/protocol@0.8.4 system.ts (maps/published_daemon.json)
// since: v0.5.4 — first release whose bundle holds this declaration; body changed in v0.8.7 (maps/history_daemon.json)
// locals: 1 renamed — 0 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.4 (medium): `duoduo session alias <key> "<name>"` — give a session a human label so it is legible in `list` and usable as a wake target.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isSessionSetAliasParams(params) {
    return !(!isRecord(params) || typeof params.session_key != "string" || params.session_key.trim().length === 0 || params.display_name !== null && typeof params.display_name != "string" || params.move !== void 0 && typeof params.move != "boolean" || params.move === !0 && (typeof params.display_name != "string" || params.display_name.trim() !== Hn) || params.caller_in_session !== void 0 && typeof params.caller_in_session != "boolean" || params.caller_session !== void 0 && (typeof params.caller_session != "string" || params.caller_session.trim().length === 0))
}
