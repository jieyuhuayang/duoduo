// duoduo reconstruction — subsystem: 03-session-actor
// symbol: resolveArchivedSessionDir  (minified: Um, daemon.pretty.js:32372)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveArchivedSessionDir(e, t) {
    return Gr.join(resolveSessionsArchiveRoot(e), hashSessionKey(t))
}
