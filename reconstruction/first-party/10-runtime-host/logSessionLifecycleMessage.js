// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: logSessionLifecycleMessage  (minified: ut, daemon.pretty.js:32065)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function logSessionLifecycleMessage(e, ...t) {
    isSessionLifecycleLoggingEnabled() && writeLogLine("debug", e, t)
}
