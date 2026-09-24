// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: resolvePendingCompactNotice  (minified: Xdt, daemon.pretty.js:71588)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolvePendingCompactNotice(e) {
    let t = e?.last_compact_at;
    if (!t) return;
    let n = Date.parse(t);
    if (Number.isNaN(n)) return;
    let r = e?.last_event_at;
    if (r) {
        let o = Date.parse(r);
        if (Number.isFinite(o) && o > n) return
    }
    let i = e?.compact_stats;
    if (i?.measured_at === t) return {
        compactedAt: t,
        preTotal: i.pre_total,
        postTotal: i.post_total,
        historyPre: i.history_pre,
        historyPost: i.history_post,
        suggestedMinContextTokens: i.suggested_min_context_tokens,
        thresholdAtFire: i.threshold_at_fire,
        transcriptPath: e?.transcript_path
    }
}
