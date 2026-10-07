// duoduo reconstruction — subsystem: 03-session-actor
// symbol: flagStreamRecreationOnModelReject  (minified: RN, daemon.pretty.js:82937)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function flagStreamRecreationOnModelReject(e, t) {
    if (!isLiveStreamRebuildRequired(e, t.requirementKind)) return !1;
    let n = e.streamingState;
    return n ? (n.needsRecreation = !0, logAlwaysAtLevel("warn", "[kv-cache] needsRecreation flagged", {
        sessionKey: e.sessionKey,
        reason: "model-apply-rejected",
        via: t.reason,
        model: t.model,
        generation: e.streamingGeneration,
        sdk_session_id: e.sdkSessionId ?? null
    }), !0) : !1
}
