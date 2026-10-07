// duoduo reconstruction — subsystem: 03-session-actor
// symbol: classifySessionPlane  (minified: hht, daemon.pretty.js:72679)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function classifySessionPlane(e) {
    return e.startsWith("system:") || e.startsWith("meta:") || e.startsWith("cadence:") ? "system" : "work"
}
