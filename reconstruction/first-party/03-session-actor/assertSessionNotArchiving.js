// duoduo reconstruction — subsystem: 03-session-actor
// symbol: assertSessionNotArchiving  (minified: ec, daemon.pretty.js:32538)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// changelog v0.5.0 (medium): Closes the last class of "writer survives past archive's liveness check and writes into a just-renamed path" races.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function assertSessionNotArchiving(e) {
    if (Ab.has(e)) throw new qm(e)
}
