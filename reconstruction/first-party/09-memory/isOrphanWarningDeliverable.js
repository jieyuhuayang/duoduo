// duoduo reconstruction — subsystem: 09-memory
// symbol: isOrphanWarningDeliverable  (minified: eSe, daemon.pretty.js:67717)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// changelog v0.5.6 (medium): Each subconscious partition declares which `.pending` signal kinds it consumes in its `contract:` frontmatter. The memory-check delivery layer validates the declaration before posting — an undeclared signal kind is withheld
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isOrphanWarningDeliverable(e, t) {
    return enforceContractGate(Vn.ORPHAN_NEWBORN, getCachedPartitionContract(e, t), e.flagFallback) === null
}
