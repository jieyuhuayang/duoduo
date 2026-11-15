// duoduo reconstruction — subsystem: 09-memory
// symbol: runBroadcastFlattenLint  (minified: cxe, daemon.pretty.js:69956)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 4 renamed — 3 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function runBroadcastFlattenLint(memoryDir) {
    let memoryDirs = resolveMemoryDirs(memoryDir),
        memoryFile = readMemoryFileSyncOrNull(memoryDirs.boardPath);
    if (memoryFile === null) return {
        selected: [],
        headings: []
    };
    let boardHeadingLines = findBoardHeadingLines(memoryFile);
    return boardHeadingLines.length === 0 ? {
        selected: [],
        headings: boardHeadingLines
    } : {
        headings: boardHeadingLines,
        selected: [{
            kind: Kn.CLAUDE_FLATTEN,
            partition: bht,
            pendingFilename: "claude-flatten.md.pending",
            pendingBody: kht(memoryDirs.boardPath, boardHeadingLines)
        }]
    }
}
