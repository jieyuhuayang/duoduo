// duoduo reconstruction — subsystem: 03-session-actor
// symbol: resolveSessionDir  (minified: Jn, daemon.pretty.js:32261)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveSessionDir(e, t) {
    return Hr.join(e.sessionsDir, hashSessionKey(t))
}
