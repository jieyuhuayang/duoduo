// duoduo reconstruction — subsystem: 03-session-actor
// symbol: isLiveStreamRebuildRequired  (minified: pJ, daemon.pretty.js:82629)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isLiveStreamRebuildRequired(e, t) {
    if (t === void 0) return !1;
    let n = e.streamingState;
    return !!(n && !n.closed)
}
