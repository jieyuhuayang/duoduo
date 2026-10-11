// duoduo reconstruction — subsystem: 03-session-actor
// symbol: recordPendingInterruptMarker  (minified: ubt, daemon.pretty.js:83093)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.2 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 3 renamed — 1 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.2 (medium): The model is told when a human ended its turn
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function recordPendingInterruptMarker(actor, reason) {
    if (!reason) return;
    let interruptMarkerText = selectInterruptMarkerText(reason, actor.activeToolCalls.size > 0);
    interruptMarkerText && (actor.pendingInterruptMarker = interruptMarkerText)
}
