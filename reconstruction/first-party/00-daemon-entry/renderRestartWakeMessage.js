// duoduo reconstruction — subsystem: 00-daemon-entry
// symbol: renderRestartWakeMessage  (minified: $Se, daemon.pretty.js:67434)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 2 renamed — 0 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderRestartWakeMessage(reason, requestedAt) {
    return ["The daemon was restarted, which may have cut off the turn you were running.", requestedAt ? `The restart was requested at ${requestedAt}.` : void 0, reason ? `Reason given by the caller: ${reason}` : void 0, "Check whether the work you were doing completed before continuing."].filter(Boolean).join(" ")
}
