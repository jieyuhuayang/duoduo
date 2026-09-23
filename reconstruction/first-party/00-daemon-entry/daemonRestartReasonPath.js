// duoduo reconstruction — subsystem: 00-daemon-entry
// symbol: daemonRestartReasonPath  (minified: Rut, daemon.pretty.js:65783)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function daemonRestartReasonPath(e) {
    return Eut.join(e.varDir, "daemon-restart-reason.json")
}
