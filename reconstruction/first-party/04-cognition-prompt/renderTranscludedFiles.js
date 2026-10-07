// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: renderTranscludedFiles  (minified: X_t, daemon.pretty.js:82507)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.2 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.5.2 (medium): injects the rendered import graph into both Claude and Codex sessions through one path.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderTranscludedFiles(e) {
    return e.map(t => `Contents of ${t.path}${Y_t}:

${t.content.trim()}`).join(`

`)
}
