// duoduo reconstruction — subsystem: 03-session-actor
// symbol: clearSessionArchiving  (minified: BR, daemon.pretty.js:32530)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// changelog v0.5.0 (medium): re-checks the archiving marker after the lock is taken.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function clearSessionArchiving(e) {
    Ab.delete(e)
}
