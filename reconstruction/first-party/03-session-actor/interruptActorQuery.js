// duoduo reconstruction — subsystem: 03-session-actor
// symbol: interruptActorQuery  (minified: jA, daemon.pretty.js:82836)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function interruptActorQuery(e) {
    e.query?.interrupt().catch(() => {})
}
