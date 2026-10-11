// duoduo reconstruction — subsystem: 00-daemon-entry
// symbol: daemonRestartReasonPath  (minified: Ect, daemon.pretty.js:66052)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.6.2 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 1 renamed — 0 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.6.2 (high): `duoduo daemon restart` takes a reason, and can wake what it interrupted. `-r "<what changed>"` reaches every session that wakes after the restart; `--wake <session-or-alias>` (repeatable) notifies a specific session
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function daemonRestartReasonPath(paths) {
    return xct.join(paths.varDir, "daemon-restart-reason.json")
}
