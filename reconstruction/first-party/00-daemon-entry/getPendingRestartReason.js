// duoduo reconstruction — subsystem: 00-daemon-entry
// symbol: getPendingRestartReason  (minified: Ube, daemon.pretty.js:65816)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function getPendingRestartReason() {
    return q$ && q$.reason.length > 0 ? q$ : void 0
}
