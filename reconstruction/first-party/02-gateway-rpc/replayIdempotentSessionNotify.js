// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: replayIdempotentSessionNotify  (minified: $St, daemon.pretty.js:92685)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.4 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 4 renamed — 0 from the code at the binding (rule), 4 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function replayIdempotentSessionNotify(event, expected) {
    let outerPayload = isRecord(event.payload) ? event.payload : {},
        innerPayload = isRecord(outerPayload.payload) ? outerPayload.payload : {};
    return event.session_key !== expected.sessionKey || innerPayload.notify_content !== expected.message ? {
        ok: !1,
        reason: "idempotency_conflict",
        target: expected.target,
        session_key: expected.sessionKey,
        idempotency_key: expected.idempotencyKey
    } : typeof innerPayload.notify_refused_reason == "string" ? {
        ok: !1,
        reason: "no_consumer",
        target: expected.target,
        session_key: expected.sessionKey,
        error: innerPayload.notify_refused_reason
    } : {
        ok: !0,
        target: expected.target,
        session_key: expected.sessionKey,
        route_id: typeof outerPayload.route_id == "string" ? outerPayload.route_id : "",
        event_id: event.id,
        ts: event.ts,
        duplicate: !0
    }
}
