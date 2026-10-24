// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: buildCompactStatsRecord  (minified: PEe, daemon.pretty.js:74463)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.10 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 11 renamed — 8 from the code at the binding (rule), 3 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function buildCompactStatsRecord(params) {
    let {
        completion,
        preTotal,
        postTotal,
        idleMs,
        thresholdAtFire,
        measuredAt,
        sessionKey,
        gapCounts
    } = params, historyPost = completion.hadBoundary ? completion.history_post : void 0, estimate = pfe({
        post_total: postTotal,
        history_post: historyPost,
        g_gt1h_since_prev_compact: gapCounts?.g_gt1h_since_prev_compact,
        g_5m1h_since_prev_compact: gapCounts?.g_5m1h_since_prev_compact
    });
    return typeof estimate.p_estimate == "number" && estimate.p_estimate < 0 && completion.hadBoundary && logWarnMessage("[runner] compact_stats: negative p_estimate (history_post > post_total)", {
        sessionKey,
        post_total: postTotal,
        history_post: historyPost,
        p_estimate: estimate.p_estimate
    }), {
        pre_total: preTotal,
        post_total: postTotal,
        history_pre: completion.hadBoundary ? completion.history_pre : void 0,
        history_post: historyPost,
        origin: completion.origin,
        idle_ms: idleMs,
        threshold_at_fire: thresholdAtFire,
        measured_at: measuredAt,
        ...estimate
    }
}
