// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: resolvePendingCompactNotice  (minified: tyt, daemon.pretty.js:73110)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.10 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 6 renamed — 0 from the code at the binding (rule), 6 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.10 (high): A one-line notice on the session's next reply reports what was compacted and its measured stats, so retuning is based on real numbers rather than guesswork. See the `smart-compaction` skill
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolvePendingCompactNotice(state) {
    let lastCompactAt = state?.last_compact_at;
    if (!lastCompactAt) return;
    let compactMs = Date.parse(lastCompactAt);
    if (Number.isNaN(compactMs)) return;
    let lastEventAt = state?.last_event_at;
    if (lastEventAt) {
        let eventMs = Date.parse(lastEventAt);
        if (Number.isFinite(eventMs) && eventMs > compactMs) return
    }
    let compactStats = state?.compact_stats;
    if (compactStats?.measured_at === lastCompactAt) return {
        compactedAt: lastCompactAt,
        preTotal: compactStats.pre_total,
        postTotal: compactStats.post_total,
        historyPre: compactStats.history_pre,
        historyPost: compactStats.history_post,
        suggestedMinContextTokens: compactStats.suggested_min_context_tokens,
        thresholdAtFire: compactStats.threshold_at_fire,
        transcriptPath: state?.transcript_path
    }
}
