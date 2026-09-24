// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: resolveBoardIncludePath  (minified: xgt, daemon.pretty.js:82334)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveBoardIncludePath(e, t) {
    return e.startsWith("~/") ? ha.join(dgt.homedir(), e.slice(2)) : ha.isAbsolute(e) ? ha.resolve(e) : ha.resolve(t, e)
}
