// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: renderWorkspaceUnavailableNotice  (minified: fht, daemon.pretty.js:72655)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderWorkspaceUnavailableNotice(e, t, n) {
    return ["Workspace unavailable. Request was not executed.", `- session_key: ${e}`, `- cwd: ${t}`, `- reason: ${n}`, "- action: reopen from an existing directory (or choose a new named session) and retry."].join(`
`)
}
