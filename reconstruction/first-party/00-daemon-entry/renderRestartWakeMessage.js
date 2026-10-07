// duoduo reconstruction — subsystem: 00-daemon-entry
// symbol: renderRestartWakeMessage  (minified: lwe, daemon.pretty.js:66127)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderRestartWakeMessage(e, t) {
    return ["The daemon was restarted, which may have cut off the turn you were running.", t ? `The restart was requested at ${t}.` : void 0, e ? `Reason given by the caller: ${e}` : void 0, "Check whether the work you were doing completed before continuing."].filter(Boolean).join(" ")
}
