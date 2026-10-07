// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: formatElapsedDuration  (minified: qxe, daemon.pretty.js:71922)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.3.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.3.0 (medium): **runner**: Add configurable time-gap session context and upgrade runtime prompt assembly to structured content blocks.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function formatElapsedDuration(e) {
    let t = Math.round(e / 6e4);
    if (t < 60) return `${t} minute${t!==1?"s":""}`;
    let n = Math.floor(t / 60),
        r = t % 60;
    if (n < 24) return r === 0 ? n === 1 ? "1 hour" : `${n} hours` : `${n} hour${n>1?"s":""} and ${r} minute${r>1?"s":""}`;
    let i = Math.floor(n / 24),
        o = n % 24;
    return o === 0 ? i === 1 ? "1 day" : `${i} days` : `${i} day${i>1?"s":""} and ${o} hour${o>1?"s":""}`
}
