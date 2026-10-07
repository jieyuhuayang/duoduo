// duoduo reconstruction — subsystem: 09-memory
// symbol: runBoardLint  (minified: ddt, daemon.pretty.js:67104)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.5 — first release whose bundle holds this declaration; body changed in v0.5.6, v0.8.0 (maps/history_daemon.json)
// changelog v0.5.5 (medium): A new cadence-driven memory lint measures the memory tree and routes convergence signals to the subconscious partitions. `ALADUO_EXP_MEMORY_CHECK=1` enables the measure-and-notify lints
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function runBoardLint(e, t) {
    let n = Number.isFinite(t) && t > 0 ? Math.floor(t) : 0,
        r = [];
    if (n === 0) return r;
    let i = e.filter(s => s.trajectory !== "NO-EFF" && s.cls === "behavioral" && s.fmt === "legacy" && !(s.trajectory === "WEAKENING" && (s.verdict === "REMOVE" || s.verdict === "DROP"))).slice(0, n);
    for (let s of i) r.push({
        target: s,
        kind: Vn.REVISE,
        partition: "pattern-tracker",
        pendingFilename: `${s.slug}.md.pending`,
        pendingBody: sdt(s)
    });
    let o = e.filter(s => s.trajectory !== "NO-EFF" && s.dual && s.cls !== "domain").slice(0, n);
    for (let s of o) r.push({
        target: s,
        kind: Vn.MERGE,
        partition: "intuition-weaver",
        pendingFilename: `merge-${s.slug}.md.pending`,
        pendingBody: adt(s)
    });
    return r
}
