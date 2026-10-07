// duoduo reconstruction — subsystem: 09-memory
// symbol: runBroadcastFlattenLint  (minified: TSe, daemon.pretty.js:68572)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function runBroadcastFlattenLint(e) {
    let t = resolveMemoryDirs(e),
        n = readMemoryFileSyncOrNull(t.boardPath);
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
            kind: Vn.CLAUDE_FLATTEN,
            partition: xft,
            pendingFilename: "claude-flatten.md.pending",
            pendingBody: Tft(t.boardPath, r)
        }]
    }
}
