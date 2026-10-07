// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: formatLocalTimestampWithZone  (minified: hA, daemon.pretty.js:70426)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.0 — first release whose bundle holds this declaration; body changed in v0.6.0 (maps/history_daemon.json)
// changelog v0.5.0 (medium): Time annotations injected into `<time-context>`, `<job-tick>`, and `<skip-rewind>` prompt blocks now include a daemon wall-clock alongside the UTC timestamp on host-mode deployments
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function formatLocalTimestampWithZone(e) {
    let t = e instanceof Date ? e : new Date(e);
    if (Number.isNaN(t.getTime())) return "";
    let n = `${t.getFullYear()}-${rp(t.getMonth()+1)}-${rp(t.getDate())}`,
        r = `${rp(t.getHours())}:${rp(t.getMinutes())}:${rp(t.getSeconds())}`,
        i = xmt(t);
    return `${n} ${r} ${i} (${kmt})`
}
