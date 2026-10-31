// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: stripBoardIncludeFrontmatter  (minified: kwt, daemon.pretty.js:83852)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.2 — first release whose bundle holds this declaration; body changed in v0.7.0 (maps/history_daemon.json)
// locals: 1 renamed — 0 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.2 (medium): The runtime parses Claude Code's `@<file>` directives itself
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function stripBoardIncludeFrontmatter(text) {
    try {
        return (0, XIe.default)(text, Er).content
    } catch {
        return text
    }
}
