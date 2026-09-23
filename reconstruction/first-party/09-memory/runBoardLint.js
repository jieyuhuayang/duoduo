// duoduo reconstruction — subsystem: 09-memory
// symbol: runBoardLint  (minified: plt, daemon.pretty.js:66835)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function runBoardLint(e, t) {
    let n = Number.isFinite(t) && t > 0 ? Math.floor(t) : 0,
        r = [];
    if (n === 0) return r;
    let i = e.filter(s => s.trajectory !== "NO-EFF" && s.cls === "behavioral" && s.fmt === "legacy" && !(s.trajectory === "WEAKENING" && (s.verdict === "REMOVE" || s.verdict === "DROP"))).slice(0, n);
    for (let s of i) r.push({
        target: s,
        kind: Un.REVISE,
        partition: "pattern-tracker",
        pendingFilename: `${s.slug}.md.pending`,
        pendingBody: ult(s)
    });
    let o = e.filter(s => s.trajectory !== "NO-EFF" && s.dual && s.cls !== "domain").slice(0, n);
    for (let s of o) r.push({
        target: s,
        kind: Un.MERGE,
        partition: "intuition-weaver",
        pendingFilename: `merge-${s.slug}.md.pending`,
        pendingBody: llt(s)
    });
    return r
}
