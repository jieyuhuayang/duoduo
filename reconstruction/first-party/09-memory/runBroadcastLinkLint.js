// duoduo reconstruction — subsystem: 09-memory
// symbol: runBroadcastLinkLint  (minified: RSe, daemon.pretty.js:68519)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function runBroadcastLinkLint(e) {
    let t = resolveMemoryDirs(e),
        n = Tn(t.boardPath);
    if (n === null) return {
        selected: [],
        brokenLinks: []
    };
    let r = extractBoardSlugLinks(n).filter(i => !bft(t, i.slug));
    return r.length === 0 ? {
        selected: [],
        brokenLinks: r
    } : {
        brokenLinks: r,
        selected: [{
            kind: Vn.CLAUDE_LINT,
            partition: hft,
            pendingFilename: "claude-lint.md.pending",
            pendingBody: Sft(t.boardPath, r)
        }]
    }
}
