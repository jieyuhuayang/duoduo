// duoduo reconstruction — subsystem: 00-daemon-entry
// symbol: getPendingRestartReason  (minified: zSe, daemon.pretty.js:67577)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function getPendingRestartReason() {
    return KO && KO.reason.length > 0 ? KO : void 0
}
