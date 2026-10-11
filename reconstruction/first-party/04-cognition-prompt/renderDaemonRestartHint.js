// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: renderDaemonRestartHint  (minified: uwe, daemon.pretty.js:66122)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// locals: 3 renamed — 0 from the code at the binding (rule), 3 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.6.2 (medium): `-r "<what changed>"` reaches every session that wakes after the restart
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderDaemonRestartHint(startedAt, restartReason) {
    let message = `[system] You're running under a new daemon process (started ${startedAt}).`;
    return restartReason ? `${message} Restart reason, given by the caller: ${restartReason.reason} (requested ${restartReason.requested_at}).` : message
}
