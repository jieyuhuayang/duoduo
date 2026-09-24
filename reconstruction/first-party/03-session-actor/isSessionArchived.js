// duoduo reconstruction — subsystem: 03-session-actor
// symbol: isSessionArchived  (minified: Ks, daemon.pretty.js:32273)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isSessionArchived(e, t) {
    return use(resolveArchivedSessionDir(e, t)) && !use(resolveSessionDir(e, t))
}
