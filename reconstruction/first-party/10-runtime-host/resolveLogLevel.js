// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: resolveLogLevel  (minified: Q7e, daemon.pretty.js:33223)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.3.3 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 1 renamed — 0 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveLogLevel(env = process.env) {
    return parseLogLevelName(env.ALADUO_LOG_LEVEL) ?? parseLogLevelName(env.NODE_ENV === "development" ? "info" : "warn") ?? "info"
}
