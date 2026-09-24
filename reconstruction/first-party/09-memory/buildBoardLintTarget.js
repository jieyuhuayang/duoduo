// duoduo reconstruction — subsystem: 09-memory
// symbol: buildBoardLintTarget  (minified: glt, daemon.pretty.js:66801)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function buildBoardLintTarget(e, t, n, r) {
    let i = fve(t, e),
        o = Rn(r) ?? "",
        s = S6.join(n.effectivenessDir, `${e}.md`),
        a = Rn(s),
        u = "NO-EFF",
        l = 0,
        c = 0,
        d = 0,
        f = null;
    if (a !== null) {
        u = parseEffectivenessTrajectory(a);
        let p = parseEffectivenessCounts(a);
        l = p.s, c = p.n, d = p.w, f = parseUpdaterGuidanceVerdict(a)
    }
    return {
        slug: e,
        boardLine: i,
        node: `topics/${e}.md`,
        hasEffectiveness: a !== null,
        trajectory: u,
        s: l,
        n: c,
        w: d,
        verdict: f,
        fmt: classifyTopicNodeFormat(o),
        cls: classifyTopicNodeType(o),
        dual: Ic(S6.join(n.entitiesDir, `${e}.md`))
    }
}
