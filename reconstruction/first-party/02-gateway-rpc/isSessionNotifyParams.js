// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: isSessionNotifyParams  (minified: uR, daemon.pretty.js:31572)
// name: INFERRED — upstream's own spelling, confirmed against the published source @openduo/protocol@0.8.4 system.ts (maps/published_daemon.json)
// since: v0.5.4 — first release whose bundle holds this declaration; body changed in v0.8.2, v0.8.4 (maps/history_daemon.json)
// changelog v0.5.4 (medium): `duoduo session notify <target> -m "<msg>"`
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isSessionNotifyParams(e) {
    return !(!isRecord(e) || typeof e.target != "string" || e.target.trim().length === 0 || typeof e.message != "string" || e.message.trim().length === 0 || e.source !== void 0 && typeof e.source != "string" || e.force !== void 0 && typeof e.force != "boolean" || e.idempotency_key !== void 0 && (typeof e.idempotency_key != "string" || e.idempotency_key.trim().length === 0) || e.exact_key !== void 0 && typeof e.exact_key != "boolean" || e.in_reply_to !== void 0 && (typeof e.in_reply_to != "string" || e.in_reply_to.trim().length === 0) || e.caller_session !== void 0 && (typeof e.caller_session != "string" || e.caller_session.trim().length === 0))
}
