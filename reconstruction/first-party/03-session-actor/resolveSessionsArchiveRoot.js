// duoduo reconstruction — subsystem: 03-session-actor
// symbol: resolveSessionsArchiveRoot  (minified: u5e, daemon.pretty.js:32265)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveSessionsArchiveRoot(e) {
    return Hr.join(e.varDir, "sessions-archive")
}
