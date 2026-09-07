// duoduo reconstruction — subsystem: 00-daemon-entry
// symbol: getPendingRestartReason  (minified: Nme, daemon.pretty.js:59342)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function getPendingRestartReason() {
    return pP && pP.reason.length > 0 ? pP : void 0
}
