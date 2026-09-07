// duoduo reconstruction — subsystem: 09-memory
// symbol: runBoardLint  (minified: mtt, daemon.pretty.js:60388)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function runBoardLint(e, t) {
    let n = Number.isFinite(t) && t > 0 ? Math.floor(t) : 0,
        r = [];
    if (n === 0) return r;
    let i = e.filter(s => s.trajectory !== "NO-EFF" && s.cls === "behavioral" && s.fmt === "legacy" && !(s.trajectory === "WEAKENING" && (s.verdict === "REMOVE" || s.verdict === "DROP"))).slice(0, n);
    for (let s of i) r.push({
        target: s,
        kind: Nn.REVISE,
        partition: "pattern-tracker",
        pendingFilename: `${s.slug}.md.pending`,
        pendingBody: utt(s)
    });
    let o = e.filter(s => s.trajectory !== "NO-EFF" && s.dual && s.cls !== "domain").slice(0, n);
    for (let s of o) r.push({
        target: s,
        kind: Nn.MERGE,
        partition: "intuition-weaver",
        pendingFilename: `merge-${s.slug}.md.pending`,
        pendingBody: ctt(s)
    });
    return r
}
