// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: resolveBoardIncludePath  (minified: abt, daemon.pretty.js:82636)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.2 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.5.2 (medium): The runtime parses Claude Code's `@<file>` directives itself
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveBoardIncludePath(e, t) {
    return e.startsWith("~/") ? ba.join(G_t.homedir(), e.slice(2)) : ba.isAbsolute(e) ? ba.resolve(e) : ba.resolve(t, e)
}
