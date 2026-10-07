// duoduo reconstruction — subsystem: 09-memory
// symbol: detectOrphanMemory  (minified: OSe, daemon.pretty.js:68660)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.5 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.5.5 (medium): `ALADUO_EXP_MEMORY_FORGET=1` additionally lets it remove long-stale, board-unreachable orphan nodes (git-recoverable).
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function detectOrphanMemory(e, t) {
    let n = computeOrphanTopicNodes(e, {
        resolve: t.resolve
    });
    if (n.missing) return {
        missing: !0,
        states: []
    };
    let r = t.newbornHours ?? WO;
    return {
        missing: !1,
        states: n.orphans.map(o => {
            let s = o.mtimeMs > 0 ? (t.refTimestampMs - o.mtimeMs) / CSe : Number.POSITIVE_INFINITY,
                a = o.indeg >= 1 ? "ISLAND" : s < r ? "NEWBORN" : "STALE";
            return {
                ...o,
                ageHours: s,
                state: a
            }
        })
    }
}
