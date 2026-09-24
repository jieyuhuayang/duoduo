// duoduo reconstruction — subsystem: 09-memory
// symbol: parseEffectivenessCounts  (minified: alt, daemon.pretty.js:66646)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function parseEffectivenessCounts(e) {
    for (let t of Bo(e))
        if (/strengthening\s*=/i.test(t)) return {
            s: w6(t, "strengthening"),
            n: w6(t, "neutral"),
            w: w6(t, "weakening")
        };
    return {
        s: 0,
        n: 0,
        w: 0
    }
}
