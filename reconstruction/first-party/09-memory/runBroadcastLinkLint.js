// duoduo reconstruction — subsystem: 09-memory
// symbol: runBroadcastLinkLint  (minified: wxe, daemon.pretty.js:70602)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 5 renamed — 2 from the code at the binding (rule), 3 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function runBroadcastLinkLint(memoryDir) {
    let memoryDirs = resolveMemoryDirs(memoryDir),
        memoryFile = readMemoryFileSyncOrNull(memoryDirs.boardPath);
    if (memoryFile === null) return {
        selected: [],
        brokenLinks: []
    };
    let brokenLinks = extractBoardSlugLinks(memoryFile).filter(link => !ygt(memoryDirs, link.slug));
    return brokenLinks.length === 0 ? {
        selected: [],
        brokenLinks
    } : {
        brokenLinks,
        selected: [{
            kind: Vn.CLAUDE_LINT,
            partition: pgt,
            pendingFilename: "claude-lint.md.pending",
            pendingBody: vgt(memoryDirs.boardPath, brokenLinks)
        }]
    }
}
