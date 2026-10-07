// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: parseBoardFileContent  (minified: nbt, daemon.pretty.js:82569)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.2 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.5.2 (medium): The runtime parses Claude Code's `@<file>` directives itself
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function parseBoardFileContent(e, t) {
    let n = stripBoardIncludeFrontmatter(e),
        i = new _a({
            gfm: !1
        }).lex(n);
    return {
        content: n.includes("<!--") ? stripBoardHtmlComments(i) : n,
        includePaths: collectBoardIncludePaths(i, t)
    }
}
