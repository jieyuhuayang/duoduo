// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: renderTimeGapContextBlock  (minified: jmt, daemon.pretty.js:71942)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.3.0 — first release whose bundle holds this declaration; body changed in v0.5.0 (maps/history_daemon.json)
// changelog v0.3.0 (high): **runner**: Add configurable time-gap session context and upgrade runtime prompt assembly to structured content blocks.
// changelog v0.5.0 (high): Time annotations injected into `<time-context>`, `<job-tick>`, and `<skip-rewind>` prompt blocks now include a daemon wall-clock alongside the UTC timestamp
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderTimeGapContextBlock(e) {
    if (!e) return;
    let t = new Date(e.lastEventAt).getTime(),
        n = new Date(e.currentEventAt).getTime();
    if (!Number.isFinite(t) || !Number.isFinite(n)) return;
    let r = n - t;
    if (r < e.thresholdMs) return;
    let i = formatElapsedDuration(r),
        o = [`<time-context last_interaction="${escapeXmlText(e.lastEventAt)}" current_time="${escapeXmlText(e.currentEventAt)}">`, `Approximately ${i} have elapsed since your last interaction in this session.`],
        s = formatLocalTimestampWithZone(e.currentEventAt);
    return s && o.push(`Daemon wall-clock time: ${s}.`), o.push("</time-context>"), o.join(`
`)
}
