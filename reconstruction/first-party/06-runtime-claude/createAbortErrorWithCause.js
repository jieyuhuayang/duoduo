// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: createAbortErrorWithCause  (minified: fg, daemon.pretty.js:55027)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 3 renamed — 1 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createAbortErrorWithCause(message, cause) {
    let error = new Error(message);
    return error.name = "AbortError", cause !== void 0 && (error.cause = cause), error
}
