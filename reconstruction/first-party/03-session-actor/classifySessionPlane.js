// duoduo reconstruction — subsystem: 03-session-actor
// symbol: classifySessionPlane  (minified: Oft, daemon.pretty.js:72377)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function classifySessionPlane(e) {
    return e.startsWith("system:") || e.startsWith("meta:") || e.startsWith("cadence:") ? "system" : "work"
}
