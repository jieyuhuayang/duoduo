// duoduo reconstruction — subsystem: 09-memory
// symbol: runMemoryCheckSubStep  (minified: HH, daemon.pretty.js:68980)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.7.1 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function runMemoryCheckSubStep(e, t) {
    try {
        return t(), !0
    } catch (n) {
        return logErrorMessage(`[memory] check tick sub-step failed: ${e}`, n), !1
    }
}
