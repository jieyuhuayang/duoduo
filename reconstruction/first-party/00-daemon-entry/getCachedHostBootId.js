// duoduo reconstruction — subsystem: 00-daemon-entry
// symbol: getCachedHostBootId  (minified: wwe, daemon.pretty.js:89289)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function getCachedHostBootId() {
    return cH || (cH = computeHostBootId()), cH
}
