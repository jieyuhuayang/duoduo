// duoduo reconstruction — subsystem: 00-daemon-entry
// symbol: renderRestartWakeMessage  (minified: Hbe, daemon.pretty.js:65855)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderRestartWakeMessage(e, t) {
    return ["The daemon was restarted, which may have cut off the turn you were running.", t ? `The restart was requested at ${t}.` : void 0, e ? `Reason given by the caller: ${e}` : void 0, "Check whether the work you were doing completed before continuing."].filter(Boolean).join(" ")
}
