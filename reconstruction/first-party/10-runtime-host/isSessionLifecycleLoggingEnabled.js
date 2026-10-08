// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: isSessionLifecycleLoggingEnabled  (minified: U8e, daemon.pretty.js:32061)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isSessionLifecycleLoggingEnabled(e = process.env) {
    return parseEnvBooleanFlag(e.ALADUO_LOG_SESSION_LIFECYCLE)
}
