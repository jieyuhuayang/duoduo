// duoduo reconstruction — subsystem: 09-memory
// symbol: runMemoryCheckSubStep  (minified: RW, daemon.pretty.js:71063)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.7.1 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 3 renamed — 1 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function runMemoryCheckSubStep(stepName, fn) {
    try {
        return fn(), !0
    } catch (err) {
        return logErrorMessage(`[memory] check tick sub-step failed: ${stepName}`, err), !1
    }
}
