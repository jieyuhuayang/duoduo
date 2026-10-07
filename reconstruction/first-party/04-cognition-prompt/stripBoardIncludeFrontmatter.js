// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: stripBoardIncludeFrontmatter  (minified: tbt, daemon.pretty.js:82561)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.2 — first release whose bundle holds this declaration; body changed in v0.7.0 (maps/history_daemon.json)
// changelog v0.5.2 (medium): The runtime parses Claude Code's `@<file>` directives itself
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function stripBoardIncludeFrontmatter(e) {
    try {
        return (0, NRe.default)(e, Sr).content
    } catch {
        return e
    }
}
