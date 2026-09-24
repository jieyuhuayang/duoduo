// duoduo reconstruction — subsystem: 09-memory
// symbol: runMemoryCheckSubStep  (minified: H6, daemon.pretty.js:68689)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function runMemoryCheckSubStep(e, t) {
    try {
        return t(), !0
    } catch (n) {
        return Le(`[memory] check tick sub-step failed: ${e}`, n), !1
    }
}
