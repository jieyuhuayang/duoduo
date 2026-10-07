// duoduo reconstruction — subsystem: 03-session-actor
// symbol: resolveSessionStatePath  (minified: ys, daemon.pretty.js:32404)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveSessionStatePath(e, t) {
    return Gr.join(resolveSessionDir(e, t), "state.json")
}
