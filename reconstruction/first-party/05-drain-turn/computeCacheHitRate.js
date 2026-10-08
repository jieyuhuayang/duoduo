// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: computeCacheHitRate  (minified: mxe, daemon.pretty.js:70405)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function computeCacheHitRate(e) {
    if (!(e.cachedInput === void 0 || e.totalInput <= 0)) return e.cachedInput / e.totalInput
}
