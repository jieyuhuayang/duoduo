// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: isSessionNotifyParams  (minified: xR, daemon.pretty.js:33654)
// name: INFERRED — upstream's own spelling, confirmed against the published source @openduo/protocol@0.8.4 system.ts (maps/published_daemon.json)
// since: v0.5.4 — first release whose bundle holds this declaration; body changed in v0.8.2, v0.8.4 (maps/history_daemon.json)
// locals: 1 renamed — 0 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.4 (medium): `duoduo session notify <target> -m "<msg>"`
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isSessionNotifyParams(params) {
    return !(!isRecord(params) || typeof params.target != "string" || params.target.trim().length === 0 || typeof params.message != "string" || params.message.trim().length === 0 || params.source !== void 0 && typeof params.source != "string" || params.force !== void 0 && typeof params.force != "boolean" || params.idempotency_key !== void 0 && (typeof params.idempotency_key != "string" || params.idempotency_key.trim().length === 0) || params.exact_key !== void 0 && typeof params.exact_key != "boolean" || params.in_reply_to !== void 0 && (typeof params.in_reply_to != "string" || params.in_reply_to.trim().length === 0) || params.caller_session !== void 0 && (typeof params.caller_session != "string" || params.caller_session.trim().length === 0))
}
