// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: replayIdempotentSessionNotify  (minified: svt, daemon.pretty.js:91177)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function replayIdempotentSessionNotify(e, t) {
    let n = at(e.payload) ? e.payload : {},
        r = at(n.payload) ? n.payload : {};
    return e.session_key !== t.sessionKey || r.notify_content !== t.message ? {
        ok: !1,
        reason: "idempotency_conflict",
        target: t.target,
        session_key: t.sessionKey,
        idempotency_key: t.idempotencyKey
    } : typeof r.notify_refused_reason == "string" ? {
        ok: !1,
        reason: "no_consumer",
        target: t.target,
        session_key: t.sessionKey,
        error: r.notify_refused_reason
    } : {
        ok: !0,
        target: t.target,
        session_key: t.sessionKey,
        route_id: typeof n.route_id == "string" ? n.route_id : "",
        event_id: e.id,
        ts: e.ts,
        duplicate: !0
    }
}
