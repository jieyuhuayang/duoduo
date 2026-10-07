// duoduo reconstruction — subsystem: 03-session-actor
// symbol: tryMarkSessionArchiving  (minified: qR, daemon.pretty.js:32526)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.5.0 (medium): re-checks the archiving marker after the lock is taken.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function tryMarkSessionArchiving(e) {
    return Ab.has(e) ? !1 : (Ab.add(e), !0)
}
