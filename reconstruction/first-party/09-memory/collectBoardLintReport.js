// duoduo reconstruction — subsystem: 09-memory
// symbol: collectBoardLintReport  (minified: Mwe, daemon.pretty.js:67040)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.5 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.5.5 (medium): A new cadence-driven memory lint measures the memory tree and routes convergence signals to the subconscious partitions. `ALADUO_EXP_MEMORY_CHECK=1` enables the measure-and-notify lints
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function collectBoardLintReport(e, t = 1, n) {
    let r = resolveMemoryDirs(e),
        i = readMemoryFileSyncOrNull(r.boardPath);
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
        let l = wH.join(r.topicsDir, `${u}.md`);
        isMemoryPathFile(l) && o.push(buildBoardLintTarget(u, i, r, l))
    }
    let s = [...o].sort(compareBoardLintTargets),
        a = runBoardLint(s, t);
    return {
        boardMissing: !1,
        targets: o,
        ranked: s,
        selections: a,
        census: udt(i),
        sinkCandidates: ldt(i)
    }
}
