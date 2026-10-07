// duoduo reconstruction — subsystem: 03-session-actor
// symbol: channelKindFromSessionKey  (minified: uk, daemon.pretty.js:80532)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function channelKindFromSessionKey(e) {
    let t = e.indexOf(":");
    return t <= 0 ? "unknown" : e.slice(0, t)
}
