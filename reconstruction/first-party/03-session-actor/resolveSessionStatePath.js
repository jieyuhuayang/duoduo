// duoduo reconstruction — subsystem: 03-session-actor
// symbol: resolveSessionStatePath  (minified: fs, daemon.pretty.js:32301)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveSessionStatePath(e, t) {
    return Hr.join(resolveSessionDir(e, t), "state.json")
}
