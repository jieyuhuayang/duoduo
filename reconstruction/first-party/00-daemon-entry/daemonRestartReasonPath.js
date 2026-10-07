// duoduo reconstruction — subsystem: 00-daemon-entry
// symbol: daemonRestartReasonPath  (minified: Ect, daemon.pretty.js:66052)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function daemonRestartReasonPath(e) {
    return xct.join(e.varDir, "daemon-restart-reason.json")
}
