// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: classifyNotifySessionKind  (minified: Ewe, daemon.pretty.js:66500)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function classifyNotifySessionKind(e) {
    return e ? e.startsWith("job:") ? "job" : e.startsWith("meta:") ? "meta" : e.startsWith("system:") || e.startsWith("cadence:") ? "system" : e.includes(":") ? "channel" : "unknown" : "unknown"
}
