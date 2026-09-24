// duoduo reconstruction — subsystem: 09-memory
// symbol: collectBoardLintReport  (minified: yve, daemon.pretty.js:66768)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function collectBoardLintReport(e, t = 1, n) {
    let r = resolveMemoryDirs(e),
        i = Rn(r.boardPath);
    if (i === null) return {
        boardMissing: !0,
        targets: [],
        ranked: [],
        selections: [],
        census: {
            pattern: 0,
            lesson: 0,
            groove: 0,
            otherDistinct: 0
        },
        sinkCandidates: []
    };
    let o = [];
    for (let u of resolveMemoryLinkTargets(i)) {
        let l = S6.join(r.topicsDir, `${u}.md`);
        Ic(l) && o.push(buildBoardLintTarget(u, i, r, l))
    }
    let s = [...o].sort(compareBoardLintTargets),
        a = runBoardLint(s, t);
    return {
        boardMissing: !1,
        targets: o,
        ranked: s,
        selections: a,
        census: mlt(i),
        sinkCandidates: hlt(i)
    }
}
