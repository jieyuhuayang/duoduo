// duoduo reconstruction — subsystem: 09-memory
// symbol: evaluatePredicateOrFalse  (minified: Bct, daemon.pretty.js:68704)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function evaluatePredicateOrFalse(e) {
    try {
        return e()
    } catch {
        return !1
    }
}
