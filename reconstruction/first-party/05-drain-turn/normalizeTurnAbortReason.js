// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: normalizeTurnAbortReason  (minified: Pg, daemon.pretty.js:62103)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.2 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.8.2 (medium): The model is told when a human ended its turn
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function normalizeTurnAbortReason(e) {
    return e === "user-cancel" || e === "preempt" ? e : void 0
}
