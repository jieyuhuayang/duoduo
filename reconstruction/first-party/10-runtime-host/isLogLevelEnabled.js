// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: isLogLevelEnabled  (minified: F8e, daemon.pretty.js:32029)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isLogLevelEnabled(e) {
    return pU[e] <= pU[resolveLogLevel()]
}
