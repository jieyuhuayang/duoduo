// duoduo reconstruction — subsystem: 09-memory
// symbol: runBoardLint  (minified: mKe, daemon.pretty.js:56297)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function runBoardLint(e, t) {
    let n = Number.isFinite(t) && t > 0 ? Math.floor(t) : 0,
        r = [];
    if (n === 0) return r;
    let i = e.filter(a => a.trajectory !== "NO-EFF" && a.cls === "behavioral" && a.fmt === "legacy" && !(a.trajectory === "WEAKENING" && (a.verdict === "REMOVE" || a.verdict === "DROP"))).slice(0, n);
    for (let a of i) r.push({
        target: a,
        kind: oi.REVISE,
        partition: "pattern-tracker",
        pendingFilename: `${a.slug}.md.pending`,
        pendingBody: cKe(a)
    });
    let s = e.filter(a => a.trajectory !== "NO-EFF" && a.cls === "domain").slice(0, n);
    for (let a of s) r.push({
        target: a,
        kind: oi.SINK,
        partition: "memory-weaver",
        pendingFilename: `sink-${a.slug}.md.pending`,
        pendingBody: uKe(a)
    });
    let o = e.filter(a => a.trajectory !== "NO-EFF" && a.dual && a.cls !== "domain").slice(0, n);
    for (let a of o) r.push({
        target: a,
        kind: oi.MERGE,
        partition: "memory-weaver",
        pendingFilename: `merge-${a.slug}.md.pending`,
        pendingBody: lKe(a)
    });
    return r
}
