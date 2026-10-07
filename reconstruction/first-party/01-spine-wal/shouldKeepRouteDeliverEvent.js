// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: shouldKeepRouteDeliverEvent  (minified: Apt, daemon.pretty.js:90355)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function shouldKeepRouteDeliverEvent(e, t) {
    return e.type !== "route.deliver" || !isRecord(e.payload) ? !1 : e.payload.source_event_type === dW || e.session_key !== void 0 && t.has(e.session_key)
}
