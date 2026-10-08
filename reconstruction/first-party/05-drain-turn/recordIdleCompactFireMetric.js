// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: recordIdleCompactFireMetric  (minified: sht, daemon.pretty.js:72413)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function recordIdleCompactFireMetric(e, t) {
    await recordTelemetryMetric(e, "idle_compact_fire", t.postTokens ?? 0, {
        session_key: t.sessionKey,
        pre_tokens: t.preTokens,
        post_tokens: t.postTokens,
        idle_ms: t.idleMs
    })
}
