// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: normalizeTurnAbortReason  (minified: Lg, daemon.pretty.js:64186)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.2 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 1 renamed — 0 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.2 (medium): The model is told when a human ended its turn
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function normalizeTurnAbortReason(reason) {
    return reason === "user-cancel" || reason === "preempt" ? reason : void 0
}
