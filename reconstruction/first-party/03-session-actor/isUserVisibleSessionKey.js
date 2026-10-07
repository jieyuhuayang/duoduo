// duoduo reconstruction — subsystem: 03-session-actor
// symbol: isUserVisibleSessionKey  (minified: uq, daemon.pretty.js:36844)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isUserVisibleSessionKey(e) {
    return classifySessionKeyKind(e) === "channel" || classifySessionKeyKind(e) === "job"
}
