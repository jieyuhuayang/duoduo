// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: runTimedDrainPhase  (minified: Eo, daemon.pretty.js:70202)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function runTimedDrainPhase(e, t, n) {
    let r = Date.now();
    try {
        return await n()
    } finally {
        yH(e, t, Date.now() - r)
    }
}
