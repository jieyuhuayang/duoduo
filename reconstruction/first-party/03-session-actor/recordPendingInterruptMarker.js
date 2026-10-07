// duoduo reconstruction — subsystem: 03-session-actor
// symbol: recordPendingInterruptMarker  (minified: ubt, daemon.pretty.js:83093)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.2 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.8.2 (medium): The model is told when a human ended its turn
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function recordPendingInterruptMarker(e, t) {
    if (!t) return;
    let n = selectInterruptMarkerText(t, e.activeToolCalls.size > 0);
    n && (e.pendingInterruptMarker = n)
}
