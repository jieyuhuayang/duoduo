// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: normalizeNotifyChannelTarget  (minified: fO, daemon.pretty.js:65019)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function normalizeNotifyChannelTarget(e) {
    let t = e.trim();
    if (!t || /\s/.test(t) || t.startsWith("session:") || t.startsWith("channel:")) return null;
    let n = t.indexOf(":");
    if (n <= 0 || n === t.length - 1) return null;
    let r = t.slice(0, n),
        i = t.slice(n + 1);
    return `${Flt[r]??r}:${i}`
}
