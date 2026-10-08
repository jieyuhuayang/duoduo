// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: parseLogLevelName  (minified: yae, daemon.pretty.js:32006)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function parseLogLevelName(e) {
    if (!e) return null;
    let t = e.toLowerCase();
    return t in pU ? t : null
}
