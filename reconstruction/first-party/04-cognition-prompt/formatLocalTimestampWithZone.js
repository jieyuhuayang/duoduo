// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: formatLocalTimestampWithZone  (minified: NA, daemon.pretty.js:71625)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.0 — first release whose bundle holds this declaration; body changed in v0.6.0 (maps/history_daemon.json)
// locals: 5 renamed — 0 from the code at the binding (rule), 5 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.0 (medium): Time annotations injected into `<time-context>`, `<job-tick>`, and `<skip-rewind>` prompt blocks now include a daemon wall-clock alongside the UTC timestamp on host-mode deployments
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function formatLocalTimestampWithZone(value) {
    let date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    let datePart = `${date.getFullYear()}-${cp(date.getMonth()+1)}-${cp(date.getDate())}`,
        timePart = `${cp(date.getHours())}:${cp(date.getMinutes())}:${cp(date.getSeconds())}`,
        offset = Vgt(date);
    return `${datePart} ${timePart} ${offset} (${Bgt})`
}
