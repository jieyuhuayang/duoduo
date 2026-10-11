// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: renderJobAcceptanceBlock  (minified: _ot, daemon.pretty.js:55396)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 2 renamed — 0 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderJobAcceptanceBlock(acceptance) {
    let trimmed = acceptance?.trim();
    if (trimmed) return ["This job is done when all of the following hold. Verify them before you", "finish, and say which ones you could not satisfy rather than finishing", "silently. Work these do not ask for is out of scope.", "", "<acceptance>", trimmed, "</acceptance>"].join(`
`)
}
