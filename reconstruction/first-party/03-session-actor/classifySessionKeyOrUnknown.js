// duoduo reconstruction — subsystem: 03-session-actor
// symbol: classifySessionKeyOrUnknown  (minified: to, daemon.pretty.js:71444)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function classifySessionKeyOrUnknown(e) {
    return e ? e.startsWith("job:") ? "job" : e.startsWith("meta:") ? "meta" : e.startsWith("system:") || e.startsWith("cadence:") ? "system" : e.includes(":") ? "channel" : "unknown" : "unknown"
}
