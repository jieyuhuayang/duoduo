// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: normalizeIncludePathKey  (minified: ORe, daemon.pretty.js:82556)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.2 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.5.2 (medium): The runtime parses Claude Code's `@<file>` directives itself and injects the rendered import graph
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function normalizeIncludePathKey(e) {
    let t = ba.resolve(e);
    return process.platform === "win32" ? t.toLowerCase() : t
}
