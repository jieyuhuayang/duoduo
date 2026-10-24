// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: writeLogLine  (minified: Qd, daemon.pretty.js:34119)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 4 renamed — 0 from the code at the binding (rule), 4 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function writeLogLine(level, message, args, options = {}) {
    !options.force && !isLogLevelEnabled(level) || console.error(formatLogPrefix(level), message, ...args)
}
