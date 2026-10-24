// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: renderJobTickBlock  (minified: j_t, daemon.pretty.js:74039)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.4.5 — first release whose bundle holds this declaration; body changed in v0.5.0 (maps/history_daemon.json)
// locals: 6 renamed — 1 from the code at the binding (rule), 5 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.4.5 (high): each trigger sends a compact `<job-tick>` metadata block with `run_number`, `triggered_at`, and `previous_run_at`.
// changelog v0.5.0 (high): Time annotations injected into `<time-context>`, `<job-tick>`, and `<skip-rewind>` prompt blocks now include a daemon wall-clock alongside the UTC timestamp
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderJobTickBlock(jobTick) {
    let formatTimestamp = timestamp => {
            let localTimestampWithZone = formatLocalTimestampWithZone(timestamp);
            return localTimestampWithZone ? `${timestamp} (daemon: ${localTimestampWithZone})` : timestamp
        },
        lines = ["<job-tick>", "Scheduled trigger for this run.", `- run_number: ${jobTick.run_number}`, `- triggered_at: ${formatTimestamp(jobTick.triggered_at)}`];
    if (jobTick.previous_run_at) {
        let elapsedMs = Date.parse(jobTick.triggered_at) - Date.parse(jobTick.previous_run_at);
        Number.isFinite(elapsedMs) && elapsedMs > 0 ? lines.push(`- previous_run_at: ${formatTimestamp(jobTick.previous_run_at)} (${formatElapsedDuration(elapsedMs)} ago)`) : lines.push(`- previous_run_at: ${formatTimestamp(jobTick.previous_run_at)}`)
    } else lines.push("- previous_run_at: (first run)");
    return lines.push(`- cron: ${jobTick.cron}`), lines.push("</job-tick>"), lines.join(`
`)
}
