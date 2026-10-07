// duoduo reconstruction — subsystem: 00-daemon-entry
// symbol: setPendingRestartReason  (minified: owe, daemon.pretty.js:66081)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// changelog v0.6.2 (medium): `duoduo daemon restart` takes a reason, and can wake what it interrupted. `-r "<what changed>"` reaches every session that wakes after the restart; `--wake <session-or-alias>` (repeatable) notifies a specific session
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function setPendingRestartReason(e) {
    xO = e ?? void 0
}
