// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: formatLocalTimestampWithZone  (minified: hA, daemon.pretty.js:70426)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
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
