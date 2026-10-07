// duoduo reconstruction — subsystem: 09-memory
// symbol: buildOrphanNewbornSignals  (minified: ASe, daemon.pretty.js:68683)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.5 — first release whose bundle holds this declaration; body changed in v0.5.6, v0.8.0 (maps/history_daemon.json)
// changelog v0.5.5 (medium): A new cadence-driven memory lint measures the memory tree and routes convergence signals to the subconscious partitions. `ALADUO_EXP_MEMORY_CHECK=1` enables the measure-and-notify lints
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function buildOrphanNewbornSignals(e, t) {
    return e.filter(n => n.state === "NEWBORN").sort((n, r) => compareStringsAscending(n.rel, r.rel)).map(n => ({
        kind: Vn.ORPHAN_NEWBORN,
        partition: routeContractDecision(n),
        pendingFilename: `orphan-newborn-${n.slug}.md.pending`,
        pendingBody: Dft(n, t)
    }))
}
