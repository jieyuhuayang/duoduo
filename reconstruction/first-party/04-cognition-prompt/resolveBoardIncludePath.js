// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: resolveBoardIncludePath  (minified: Pwt, daemon.pretty.js:83927)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.2 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 2 renamed — 0 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.2 (medium): The runtime parses Claude Code's `@<file>` directives itself
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveBoardIncludePath(includePath, baseDir) {
    return includePath.startsWith("~/") ? Ea.join(gwt.homedir(), includePath.slice(2)) : Ea.isAbsolute(includePath) ? Ea.resolve(includePath) : Ea.resolve(baseDir, includePath)
}
