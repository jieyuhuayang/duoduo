// duoduo reconstruction — subsystem: 03-session-actor
// symbol: recordPendingInterruptMarker  (minified: ubt, daemon.pretty.js:83093)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function recordPendingInterruptMarker(e, t) {
    if (!t) return;
    let n = selectInterruptMarkerText(t, e.activeToolCalls.size > 0);
    n && (e.pendingInterruptMarker = n)
}
