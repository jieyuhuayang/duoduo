// duoduo reconstruction — subsystem: 09-memory
// symbol: splitLinesDropTrailingEmpty  (minified: Jo, daemon.pretty.js:66814)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.5 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 2 renamed — 1 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function splitLinesDropTrailingEmpty(text) {
    let parts = text.split(`
`);
    return parts.length > 0 && parts[parts.length - 1] === "" && parts.pop(), parts
}
