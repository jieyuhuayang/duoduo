// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: renderSmartCompactNoticeBlock  (minified: Qdt, daemon.pretty.js:71611)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderSmartCompactNoticeBlock(e) {
    let t = `compacted ${e.compactedAt}`,
        n = [];
    typeof e.preTotal == "number" && typeof e.postTotal == "number" ? n.push(`ctx ${e.preTotal}→${e.postTotal}`) : typeof e.postTotal == "number" && n.push(`ctx →${e.postTotal}`), typeof e.historyPre == "number" && typeof e.historyPost == "number" && n.push(`history ${e.historyPre}→${e.historyPost}`), n.length > 0 && (t += `: ${n.join(", ")}`);
    let r = ["<smart-compact-notice>", t];
    return typeof e.thresholdAtFire == "number" && typeof e.suggestedMinContextTokens == "number" && e.thresholdAtFire < e.suggestedMinContextTokens && r.push(`threshold ${e.thresholdAtFire} < suggested ${e.suggestedMinContextTokens} — re-calibrate via smart-compaction skill`), typeof e.transcriptPath == "string" && e.transcriptPath.length > 0 ? r.push(`full pre-compact transcript survives at ${e.transcriptPath} — for lost recent detail, search it with a cheap subagent; memory/dossiers lag hours`) : r.push("when unsure of pre-compact specifics, consult memory/dossiers — don't reconstruct from the summary"), r.push("</smart-compact-notice>"), r.join(`
`)
}
