// duoduo reconstruction — subsystem: 09-memory
// symbol: detectOrphanMemory  (minified: ple, daemon.pretty.js:56732)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function detectOrphanMemory(e, t) {
    let n = AKe(e, {
        resolve: t.resolve
    });
    if (n.missing) return {
        missing: !0,
        states: []
    };
    let r = t.newbornHours ?? bR;
    return {
        missing: !1,
        states: n.orphans.map(s => {
            let o = s.mtimeMs > 0 ? (t.refTimestampMs - s.mtimeMs) / fle : Number.POSITIVE_INFINITY,
                a = s.indeg >= 1 ? "ISLAND" : o < r ? "NEWBORN" : "STALE";
            return {
                ...s,
                ageHours: o,
                state: a
            }
        })
    }
}
