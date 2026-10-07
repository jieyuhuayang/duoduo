// duoduo reconstruction — subsystem: 09-memory
// symbol: isOrphanWarningDeliverable  (minified: eSe, daemon.pretty.js:67717)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isOrphanWarningDeliverable(e, t) {
    return enforceContractGate(Vn.ORPHAN_NEWBORN, getCachedPartitionContract(e, t), e.flagFallback) === null
}
