// duoduo reconstruction — subsystem: 03-session-actor
// symbol: triggerDeferredPreempt  (minified: RG, daemon.pretty.js:83140)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in v0.8.2 (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function triggerDeferredPreempt(e) {
    let t = e.pendingPreemptReason ?? void 0;
    if (e.pendingPreemptReason = null, e.query) {
        interruptActorQuery(e);
        return
    }
    e.currentAbortController?.abort(t)
}
