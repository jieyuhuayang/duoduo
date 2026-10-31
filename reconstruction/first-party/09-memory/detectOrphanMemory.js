// duoduo reconstruction — subsystem: 09-memory
// symbol: detectOrphanMemory  (minified: Zke, daemon.pretty.js:69859)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.5 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 7 renamed — 1 from the code at the binding (rule), 6 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.5 (medium): `ALADUO_EXP_MEMORY_FORGET=1` additionally lets it remove long-stale, board-unreachable orphan nodes (git-recoverable).
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function detectOrphanMemory(memoryDir, options) {
    let orphanTopicNodes = computeOrphanTopicNodes(memoryDir, {
        resolve: options.resolve
    });
    if (orphanTopicNodes.missing) return {
        missing: !0,
        states: []
    };
    let newbornHours = options.newbornHours ?? dA;
    return {
        missing: !1,
        states: orphanTopicNodes.orphans.map(orphan => {
            let ageHours = orphan.mtimeMs > 0 ? (options.refTimestampMs - orphan.mtimeMs) / Kke : Number.POSITIVE_INFINITY,
                state = orphan.indeg >= 1 ? "ISLAND" : ageHours < newbornHours ? "NEWBORN" : "STALE";
            return {
                ...orphan,
                ageHours,
                state
            }
        })
    }
}
