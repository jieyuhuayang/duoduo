// duoduo reconstruction — subsystem: 03-session-actor
// symbol: classifySessionPlaneByKey  (minified: Qbt, daemon.pretty.js:90686)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function classifySessionPlaneByKey(e) {
    return e.startsWith("system:") || e.startsWith("meta:") || e.startsWith("cadence:") ? "system" : "work"
}
