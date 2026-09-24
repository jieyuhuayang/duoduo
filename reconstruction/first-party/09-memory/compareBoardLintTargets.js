// duoduo reconstruction — subsystem: 09-memory
// symbol: compareBoardLintTargets  (minified: dlt, daemon.pretty.js:66717)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function compareBoardLintTargets(e, t) {
    let n = rankEffectivenessTrajectory(e.trajectory),
        r = rankEffectivenessTrajectory(t.trajectory);
    if (n !== r) return r - n;
    let i = e.s + e.n + e.w,
        o = t.s + t.n + t.w;
    return i !== o ? o - i : Tr(e.slug, t.slug)
}
