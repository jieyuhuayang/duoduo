// duoduo reconstruction — subsystem: 03-session-actor
// symbol: teardownStreamingSession  (minified: Zf, daemon.pretty.js:82863)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function teardownStreamingSession(e, t, n) {
    let r = e.streamingState;
    if (!r) return;
    t && _t("warn", `[kv-cache] streaming teardown: ${t}`, {
        sessionKey: e.sessionKey,
        generation: e.streamingGeneration,
        sdk_session_id: e.sdkSessionId ?? null
    }), Egt(e, n);
    let i = e.query;
    e.streamingState = null, e.query = null, e.streamAbortController = null, e.spawnBoardHash = void 0, r.abortController.signal.aborted || r.abortController.abort(n), typeof i?.close == "function" && i.close();
    try {
        await r.loopPromise
    } catch {}
}
