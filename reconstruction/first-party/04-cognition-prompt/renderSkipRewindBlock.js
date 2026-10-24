// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: renderSkipRewindBlock  (minified: C_t, daemon.pretty.js:73959)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.5.0, v0.5.5 (maps/history_daemon.json)
// locals: 9 renamed — 3 from the code at the binding (rule), 6 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.0 (high): Time annotations injected into `<time-context>`, `<job-tick>`, and `<skip-rewind>` prompt blocks now include a daemon wall-clock alongside the UTC timestamp
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderSkipRewindBlock(skipRewind) {
    if (!skipRewind) return;
    let skippedAt = skipRewind.skipped_at,
        date = new Date,
        nowIso = date.toISOString(),
        elapsedMs = Date.now() - new Date(skippedAt).getTime(),
        elapsedMinutes = Math.round(elapsedMs / 6e4),
        elapsedLabel = elapsedMinutes < 1 ? "<1m" : `${elapsedMinutes}m`,
        localTimestampWithZone = formatLocalTimestampWithZone(date),
        timeLine = localTimestampWithZone ? `Current time: ${nowIso} (daemon: ${localTimestampWithZone}) (elapsed: ${elapsedLabel} since skip)` : `Current time: ${nowIso} (elapsed: ${elapsedLabel} since skip)`;
    return [`<skip-rewind skipped_at="${skippedAt}">`, "You chose to skip your previous turn without replying to the user.", `Reason: "${skipRewind.reason}"`, "Anything your skipped turn produced was not delivered; the user did not see it.", timeLine, "</skip-rewind>"].join(`
`)
}
