// duoduo reconstruction — subsystem: 03-session-actor
// symbol: isLiveStreamRebuildRequired  (minified: EG, daemon.pretty.js:82931)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in v0.8.2 (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isLiveStreamRebuildRequired(e, t) {
    if (t === void 0) return !1;
    let n = e.streamingState;
    return !!(n && !n.closed)
}
