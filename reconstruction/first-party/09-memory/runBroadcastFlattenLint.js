// duoduo reconstruction — subsystem: 09-memory
// symbol: runBroadcastFlattenLint  (minified: fwe, daemon.pretty.js:68281)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function runBroadcastFlattenLint(e) {
    let t = resolveMemoryDirs(e),
        n = Rn(t.boardPath);
    if (n === null) return {
        selected: [],
        headings: []
    };
    let r = findBoardHeadingLines(n);
    return r.length === 0 ? {
        selected: [],
        headings: r
    } : {
        headings: r,
        selected: [{
            kind: Un.CLAUDE_FLATTEN,
            partition: Pct,
            pendingFilename: "claude-flatten.md.pending",
            pendingBody: Act(t.boardPath, r)
        }]
    }
}
