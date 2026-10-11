// duoduo reconstruction — subsystem: 09-memory
// symbol: getCachedPartitionContract  (minified: FO, daemon.pretty.js:67575)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.6 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 3 renamed — 0 from the code at the binding (rule), 3 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.6 (medium): Each subconscious partition declares which `.pending` signal kinds it consumes in its `contract:` frontmatter. The memory-check delivery layer validates the declaration before posting — an undeclared signal kind is withheld
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function getCachedPartitionContract(ctx, partition) {
    ctx.contracts || (ctx.contracts = new Map);
    let contract = ctx.contracts.get(partition);
    return contract === void 0 && (contract = readPartitionContract(ctx.subconsciousDir, partition), ctx.contracts.set(partition, contract)), contract
}
