// duoduo reconstruction — subsystem: 03-session-actor
// symbol: classifySessionPoolKind  (minified: vEe, daemon.pretty.js:80259)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function classifySessionPoolKind(e, t) {
    return t === "job" || e.startsWith("job:") ? "job" : "channel"
}
