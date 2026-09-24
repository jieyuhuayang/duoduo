// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: isOrphanJobSessionKey  (minified: Z_e, daemon.pretty.js:65034)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isOrphanJobSessionKey(e, t) {
    return t !== null && e.startsWith("job:") && !t.has(e)
}
