// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: renderJobTickBlock  (minified: Fmt, daemon.pretty.js:71956)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.4.5 — first release whose bundle holds this declaration; body changed in v0.5.0 (maps/history_daemon.json)
// changelog v0.4.5 (high): each trigger sends a compact `<job-tick>` metadata block with `run_number`, `triggered_at`, and `previous_run_at`.
// changelog v0.5.0 (high): Time annotations injected into `<time-context>`, `<job-tick>`, and `<skip-rewind>` prompt blocks now include a daemon wall-clock alongside the UTC timestamp
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderJobTickBlock(e) {
    let t = r => {
            let i = formatLocalTimestampWithZone(r);
            return i ? `${r} (daemon: ${i})` : r
        },
        n = ["<job-tick>", "Scheduled trigger for this run.", `- run_number: ${e.run_number}`, `- triggered_at: ${t(e.triggered_at)}`];
    if (e.previous_run_at) {
        let r = Date.parse(e.triggered_at) - Date.parse(e.previous_run_at);
        Number.isFinite(r) && r > 0 ? n.push(`- previous_run_at: ${t(e.previous_run_at)} (${formatElapsedDuration(r)} ago)`) : n.push(`- previous_run_at: ${t(e.previous_run_at)}`)
    } else n.push("- previous_run_at: (first run)");
    return n.push(`- cron: ${e.cron}`), n.push("</job-tick>"), n.join(`
`)
}
