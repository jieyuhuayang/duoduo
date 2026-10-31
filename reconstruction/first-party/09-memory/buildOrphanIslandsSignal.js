// duoduo reconstruction — subsystem: 09-memory
// symbol: buildOrphanIslandsSignal  (minified: exe, daemon.pretty.js:69959)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.5 — first release whose bundle holds this declaration; body changed in v0.5.6, v0.8.0 (maps/history_daemon.json)
// locals: 5 renamed — 0 from the code at the binding (rule), 5 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.5 (medium): A new cadence-driven memory lint measures the memory tree and routes convergence signals to the subconscious partitions. `ALADUO_EXP_MEMORY_CHECK=1` enables the measure-and-notify lints
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function buildOrphanIslandsSignal(islands, nowMs, scope = "topics", newbornHours = dA, touchWindow) {
    return islands.length === 0 ? null : {
        kind: Jn.ORPHAN_ISLANDS,
        partition: "intuition-weaver",
        pendingFilename: "orphan-islands.md.pending",
        pendingBody: renderOrphanIslandsBody(islands, scope, nowMs, newbornHours, touchWindow)
    }
}
