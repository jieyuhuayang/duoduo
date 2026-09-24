// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: normalizeTurnAbortReason  (minified: sg, daemon.pretty.js:61784)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function normalizeTurnAbortReason(e) {
    return e === "user-cancel" || e === "preempt" ? e : void 0
}
