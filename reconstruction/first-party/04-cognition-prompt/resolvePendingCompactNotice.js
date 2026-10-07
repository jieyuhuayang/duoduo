// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: resolvePendingCompactNotice  (minified: Dmt, daemon.pretty.js:71890)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.10 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.5.10 (high): A one-line notice on the session's next reply reports what was compacted and its measured stats, so retuning is based on real numbers rather than guesswork. See the `smart-compaction` skill
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
