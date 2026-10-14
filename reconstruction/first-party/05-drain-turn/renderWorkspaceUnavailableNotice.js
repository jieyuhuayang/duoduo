// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: renderWorkspaceUnavailableNotice  (minified: mht, daemon.pretty.js:72656)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 3 renamed — 0 from the code at the binding (rule), 3 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderWorkspaceUnavailableNotice(sessionKey, cwd, reason) {
    return ["Workspace unavailable. Request was not executed.", `- session_key: ${sessionKey}`, `- cwd: ${cwd}`, `- reason: ${reason}`, "- action: reopen from an existing directory (or choose a new named session) and retry."].join(`
`)
}
