// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: runTimedDrainPhase  (minified: Io, daemon.pretty.js:70493)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// locals: 4 renamed — 1 from the code at the binding (rule), 3 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function runTimedDrainPhase(perf, field, fn) {
    let now = Date.now();
    try {
        return await fn()
    } finally {
        addToNumericField(perf, field, Date.now() - now)
    }
}
