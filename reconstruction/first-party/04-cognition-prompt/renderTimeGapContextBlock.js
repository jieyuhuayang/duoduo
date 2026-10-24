// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: renderTimeGapContextBlock  (minified: D_t, daemon.pretty.js:74025)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.3.0 — first release whose bundle holds this declaration; body changed in v0.5.0 (maps/history_daemon.json)
// locals: 7 renamed — 2 from the code at the binding (rule), 5 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.3.0 (high): **runner**: Add configurable time-gap session context and upgrade runtime prompt assembly to structured content blocks.
// changelog v0.5.0 (high): Time annotations injected into `<time-context>`, `<job-tick>`, and `<skip-rewind>` prompt blocks now include a daemon wall-clock alongside the UTC timestamp
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderTimeGapContextBlock(timeGap) {
    if (!timeGap) return;
    let lastMs = new Date(timeGap.lastEventAt).getTime(),
        currentMs = new Date(timeGap.currentEventAt).getTime();
    if (!Number.isFinite(lastMs) || !Number.isFinite(currentMs)) return;
    let gapMs = currentMs - lastMs;
    if (gapMs < timeGap.thresholdMs) return;
    let elapsedDuration = formatElapsedDuration(gapMs),
        lines = [`<time-context last_interaction="${escapeXmlText(timeGap.lastEventAt)}" current_time="${escapeXmlText(timeGap.currentEventAt)}">`, `Approximately ${elapsedDuration} have elapsed since your last interaction in this session.`],
        localTimestampWithZone = formatLocalTimestampWithZone(timeGap.currentEventAt);
    return localTimestampWithZone && lines.push(`Daemon wall-clock time: ${localTimestampWithZone}.`), lines.push("</time-context>"), lines.join(`
`)
}
