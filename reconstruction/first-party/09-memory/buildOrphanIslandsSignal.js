// duoduo reconstruction — subsystem: 09-memory
// symbol: buildOrphanIslandsSignal  (minified: vwe, daemon.pretty.js:68469)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function buildOrphanIslandsSignal(e, t, n = "topics", r = lO, i) {
    return e.length === 0 ? null : {
        kind: Un.ORPHAN_ISLANDS,
        partition: "intuition-weaver",
        pendingFilename: "orphan-islands.md.pending",
        pendingBody: renderOrphanIslandsBody(e, n, t, r, i)
    }
}
