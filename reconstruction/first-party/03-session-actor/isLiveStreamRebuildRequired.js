// duoduo reconstruction — subsystem: 03-session-actor
// symbol: isLiveStreamRebuildRequired  (minified: RG, daemon.pretty.js:82977)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in v0.8.2 (maps/history_daemon.json)
// locals: 3 renamed — 1 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isLiveStreamRebuildRequired(actor, requirementKind) {
    if (requirementKind === void 0) return !1;
    let streamingState = actor.streamingState;
    return !!(streamingState && !streamingState.closed)
}
