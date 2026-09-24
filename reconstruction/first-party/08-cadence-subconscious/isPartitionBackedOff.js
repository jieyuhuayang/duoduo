// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: isPartitionBackedOff  (minified: _6, daemon.pretty.js:66447)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isPartitionBackedOff(e, t) {
    return e.backoff_until ? t.getTime() < new Date(e.backoff_until).getTime() : !1
}
