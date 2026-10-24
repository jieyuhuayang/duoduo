// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: logTraceMessage  (minified: dle, daemon.pretty.js:34139)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// locals: 2 renamed — 0 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function logTraceMessage(message, ...args) {
    writeLogLine("trace", message, args)
}
