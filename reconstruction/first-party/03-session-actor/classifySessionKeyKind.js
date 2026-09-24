// duoduo reconstruction — subsystem: 03-session-actor
// symbol: classifySessionKeyKind  (minified: lr, daemon.pretty.js:64073)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function classifySessionKeyKind(e) {
    return e.startsWith("meta:") || e.startsWith("cadence:") ? "meta" : e.startsWith("subconscious:") ? "subconscious" : e.startsWith("system:") ? "system" : e.startsWith("job:") ? "job" : "channel"
}
