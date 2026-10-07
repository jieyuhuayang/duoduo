// duoduo reconstruction — subsystem: 03-session-actor
// symbol: createEmptySessionIndex  (minified: Xce, daemon.pretty.js:36857)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// changelog v0.5.0 (medium): `SessionIndex` is now the in-memory derived view of `var/sessions/<hash>/state.json`
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createEmptySessionIndex() {
    return createMapBackedSessionIndex(new Map)
}
