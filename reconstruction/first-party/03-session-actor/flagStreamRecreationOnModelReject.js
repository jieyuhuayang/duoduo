// duoduo reconstruction — subsystem: 03-session-actor
// symbol: flagStreamRecreationOnModelReject  (minified: RN, daemon.pretty.js:82937)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 3 renamed — 1 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function flagStreamRecreationOnModelReject(actor, rejection) {
    if (!isLiveStreamRebuildRequired(actor, rejection.requirementKind)) return !1;
    let streamingState = actor.streamingState;
    return streamingState ? (streamingState.needsRecreation = !0, logAlwaysAtLevel("warn", "[kv-cache] needsRecreation flagged", {
        sessionKey: actor.sessionKey,
        reason: "model-apply-rejected",
        via: rejection.reason,
        model: rejection.model,
        generation: actor.streamingGeneration,
        sdk_session_id: actor.sdkSessionId ?? null
    }), !0) : !1
}
