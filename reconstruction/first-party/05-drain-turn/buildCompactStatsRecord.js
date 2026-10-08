// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: buildCompactStatsRecord  (minified: Nxe, daemon.pretty.js:72380)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function buildCompactStatsRecord(e) {
    let {
        completion: t,
        preTotal: n,
        postTotal: r,
        idleMs: i,
        thresholdAtFire: o,
        measuredAt: s,
        sessionKey: a,
        gapCounts: u
    } = e, l = t.hadBoundary ? t.history_post : void 0, c = vce({
        post_total: r,
        history_post: l,
        g_gt1h_since_prev_compact: u?.g_gt1h_since_prev_compact,
        g_5m1h_since_prev_compact: u?.g_5m1h_since_prev_compact
    });
    return typeof c.p_estimate == "number" && c.p_estimate < 0 && t.hadBoundary && logWarnMessage("[runner] compact_stats: negative p_estimate (history_post > post_total)", {
        sessionKey: a,
        post_total: r,
        history_post: l,
        p_estimate: c.p_estimate
    }), {
        pre_total: n,
        post_total: r,
        history_pre: t.hadBoundary ? t.history_pre : void 0,
        history_post: l,
        origin: t.origin,
        idle_ms: i,
        threshold_at_fire: o,
        measured_at: s,
        ...c
    }
}
