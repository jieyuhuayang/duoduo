// duoduo reconstruction — subsystem: 09-memory
// symbol: compareBoardLintTargets  (minified: Ept, daemon.pretty.js:68188)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.5 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 6 renamed — 0 from the code at the binding (rule), 6 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function compareBoardLintTargets(a, b) {
    let rankA = rankEffectivenessTrajectory(a.trajectory),
        rankB = rankEffectivenessTrajectory(b.trajectory);
    if (rankA !== rankB) return rankB - rankA;
    let totalA = a.s + a.n + a.w,
        totalB = b.s + b.n + b.w;
    return totalA !== totalB ? totalB - totalA : compareStringsAscending(a.slug, b.slug)
}
