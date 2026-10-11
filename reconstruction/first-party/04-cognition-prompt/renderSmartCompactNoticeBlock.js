// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: renderSmartCompactNoticeBlock  (minified: Mmt, daemon.pretty.js:71913)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.10 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 4 renamed — 0 from the code at the binding (rule), 4 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.10 (high): A one-line notice on the session's next reply reports what was compacted and its measured stats, so retuning is based on real numbers rather than guesswork. See the `smart-compaction` skill
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderSmartCompactNoticeBlock(notice) {
    let summary = `compacted ${notice.compactedAt}`,
        parts = [];
    typeof notice.preTotal == "number" && typeof notice.postTotal == "number" ? parts.push(`ctx ${notice.preTotal}→${notice.postTotal}`) : typeof notice.postTotal == "number" && parts.push(`ctx →${notice.postTotal}`), typeof notice.historyPre == "number" && typeof notice.historyPost == "number" && parts.push(`history ${notice.historyPre}→${notice.historyPost}`), parts.length > 0 && (summary += `: ${parts.join(", ")}`);
    let lines = ["<smart-compact-notice>", summary];
    return typeof notice.thresholdAtFire == "number" && typeof notice.suggestedMinContextTokens == "number" && notice.thresholdAtFire < notice.suggestedMinContextTokens && lines.push(`threshold ${notice.thresholdAtFire} < suggested ${notice.suggestedMinContextTokens} — re-calibrate via smart-compaction skill`), typeof notice.transcriptPath == "string" && notice.transcriptPath.length > 0 ? lines.push(`full pre-compact transcript survives at ${notice.transcriptPath} — for lost recent detail, search it with a cheap subagent; memory/dossiers lag hours`) : lines.push("when unsure of pre-compact specifics, consult memory/dossiers — don't reconstruct from the summary"), lines.push("</smart-compact-notice>"), lines.join(`
`)
}
