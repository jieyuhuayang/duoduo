// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: isStaleIdleCompactEvent  (minified: oht, daemon.pretty.js:72352)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.10 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 3 renamed — 0 from the code at the binding (rule), 3 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isStaleIdleCompactEvent(eventTs, actorState) {
    if (!eventTs) return !1;
    let eventMs = Date.parse(eventTs);
    return Number.isNaN(eventMs) ? !1 : typeof actorState.actorSpawnedAt == "number" && eventMs < actorState.actorSpawnedAt || typeof actorState.actorLastTurnCompletedAt == "number" && actorState.actorLastTurnCompletedAt > eventMs
}
