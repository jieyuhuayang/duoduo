// duoduo reconstruction — subsystem: 09-memory
// symbol: buildOrphanNewbornSignals  (minified: ASe, daemon.pretty.js:68683)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function buildOrphanNewbornSignals(e, t) {
    return e.filter(n => n.state === "NEWBORN").sort((n, r) => Ar(n.rel, r.rel)).map(n => ({
        kind: Vn.ORPHAN_NEWBORN,
        partition: routeContractDecision(n),
        pendingFilename: `orphan-newborn-${n.slug}.md.pending`,
        pendingBody: Dft(n, t)
    }))
}
