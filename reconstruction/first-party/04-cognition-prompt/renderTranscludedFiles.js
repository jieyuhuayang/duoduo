// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: renderTranscludedFiles  (minified: X_t, daemon.pretty.js:82507)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderTranscludedFiles(e) {
    return e.map(t => `Contents of ${t.path}${Y_t}:

${t.content.trim()}`).join(`

`)
}
