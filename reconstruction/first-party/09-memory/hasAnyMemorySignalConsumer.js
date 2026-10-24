// duoduo reconstruction — subsystem: 09-memory
// symbol: hasAnyMemorySignalConsumer  (minified: Gke, daemon.pretty.js:69791)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.6 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 5 renamed — 2 from the code at the binding (rule), 3 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.6 (medium): Each subconscious partition declares which `.pending` signal kinds it consumes in its `contract:` frontmatter. The memory-check delivery layer validates the declaration before posting — an undeclared signal kind is withheld
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function hasAnyMemorySignalConsumer(ctx) {
    let values = Object.values(Vn);
    for (let partition of dW) {
        let cachedPartitionContract = getCachedPartitionContract(ctx, partition);
        if (values.some(kind => enforceContractGate(kind, cachedPartitionContract, ctx.flagFallback) === null)) return !0
    }
    return !1
}
