// duoduo reconstruction — subsystem: 09-memory
// symbol: detectOrphanMemory  (minified: fye, daemon.pretty.js:62512)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function detectOrphanMemory(e, t) {
    let n = dit(e, {
        resolve: t.resolve
    });
    if (n.missing) return {
        missing: !0,
        states: []
    };
    let r = t.newbornHours ?? QP;
    return {
        missing: !1,
        states: n.orphans.map(o => {
            let s = o.mtimeMs > 0 ? (t.refTimestampMs - o.mtimeMs) / dye : Number.POSITIVE_INFINITY,
                a = o.indeg >= 1 ? "ISLAND" : s < r ? "NEWBORN" : "STALE";
            return {
                ...o,
                ageHours: s,
                state: a
            }
        })
    }
}
