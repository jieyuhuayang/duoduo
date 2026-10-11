// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: resolveLogLevel  (minified: L8e, daemon.pretty.js:32025)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.3.3 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveLogLevel(e = process.env) {
    return parseLogLevelName(e.ALADUO_LOG_LEVEL) ?? parseLogLevelName(e.NODE_ENV === "development" ? "info" : "warn") ?? "info"
}
