// duoduo reconstruction — subsystem: 09-memory
// symbol: buildOrphanIslandsSignal  (minified: MSe, daemon.pretty.js:68760)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.5 — first release whose bundle holds this declaration; body changed in v0.5.6, v0.8.0 (maps/history_daemon.json)
// changelog v0.5.5 (medium): A new cadence-driven memory lint measures the memory tree and routes convergence signals to the subconscious partitions. `ALADUO_EXP_MEMORY_CHECK=1` enables the measure-and-notify lints
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function buildOrphanIslandsSignal(e, t, n = "topics", r = WO, i) {
    return e.length === 0 ? null : {
        kind: Vn.ORPHAN_ISLANDS,
        partition: "intuition-weaver",
        pendingFilename: "orphan-islands.md.pending",
        pendingBody: renderOrphanIslandsBody(e, n, t, r, i)
    }
}
