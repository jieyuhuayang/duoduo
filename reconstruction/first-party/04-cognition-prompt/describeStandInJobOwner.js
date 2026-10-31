// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: describeStandInJobOwner  (minified: s0e, daemon.pretty.js:72967)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.7 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function describeStandInJobOwner(e) {
    return e.owner ? `owned by session ${e.owner} (it reached you as the main session)` : "that has no recorded owner (it reached you as the main session)"
}
