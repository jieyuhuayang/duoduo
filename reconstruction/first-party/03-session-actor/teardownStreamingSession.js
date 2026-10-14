// duoduo reconstruction — subsystem: 03-session-actor
// symbol: teardownStreamingSession  (minified: lp, daemon.pretty.js:83209)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in v0.8.2 (maps/history_daemon.json)
// locals: 5 renamed — 2 from the code at the binding (rule), 3 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function teardownStreamingSession(actor, teardownReason, abortReason) {
    let streamingState = actor.streamingState;
    if (!streamingState) return;
    teardownReason && logAlwaysAtLevel("warn", `[kv-cache] streaming teardown: ${teardownReason}`, {
        sessionKey: actor.sessionKey,
        generation: actor.streamingGeneration,
        sdk_session_id: actor.sdkSessionId ?? null
    }), recordPendingInterruptMarker(actor, abortReason);
    let query = actor.query;
    actor.streamingState = null, actor.query = null, actor.streamAbortController = null, actor.spawnBoardHash = void 0, streamingState.abortController.signal.aborted || streamingState.abortController.abort(abortReason), typeof query?.close == "function" && query.close();
    try {
        await streamingState.loopPromise
    } catch {}
}
