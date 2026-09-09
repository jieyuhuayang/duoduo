// duoduo reconstruction — subsystem: 00-daemon-entry
// symbol: getPendingRestartReason  (minified: Ihe, daemon.pretty.js:59956)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function getPendingRestartReason() {
    return OP && OP.reason.length > 0 ? OP : void 0
}
