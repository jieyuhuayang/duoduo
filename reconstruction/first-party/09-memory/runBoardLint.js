// duoduo reconstruction — subsystem: 09-memory
// symbol: runBoardLint  (minified: lht, daemon.pretty.js:69187)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.5 — first release whose bundle holds this declaration; body changed in v0.5.6, v0.8.0 (maps/history_daemon.json)
// locals: 10 renamed — 0 from the code at the binding (rule), 10 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.5 (medium): A new cadence-driven memory lint measures the memory tree and routes convergence signals to the subconscious partitions. `ALADUO_EXP_MEMORY_CHECK=1` enables the measure-and-notify lints
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function runBoardLint(ranked, limit) {
    let maxCount = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 0,
        selections = [];
    if (maxCount === 0) return selections;
    let reviseTargets = ranked.filter(candidate => candidate.trajectory !== "NO-EFF" && candidate.cls === "behavioral" && candidate.fmt === "legacy" && !(candidate.trajectory === "WEAKENING" && (candidate.verdict === "REMOVE" || candidate.verdict === "DROP"))).slice(0, maxCount);
    for (let reviseTarget of reviseTargets) selections.push({
        target: reviseTarget,
        kind: Vn.REVISE,
        partition: "pattern-tracker",
        pendingFilename: `${reviseTarget.slug}.md.pending`,
        pendingBody: iht(reviseTarget)
    });
    let mergeTargets = ranked.filter(candidate => candidate.trajectory !== "NO-EFF" && candidate.dual && candidate.cls !== "domain").slice(0, maxCount);
    for (let mergeTarget of mergeTargets) selections.push({
        target: mergeTarget,
        kind: Vn.MERGE,
        partition: "intuition-weaver",
        pendingFilename: `merge-${mergeTarget.slug}.md.pending`,
        pendingBody: oht(mergeTarget)
    });
    return selections
}
