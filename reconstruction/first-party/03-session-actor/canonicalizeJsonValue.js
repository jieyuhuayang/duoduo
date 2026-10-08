// duoduo reconstruction — subsystem: 03-session-actor
// symbol: canonicalizeJsonValue  (minified: qW, daemon.pretty.js:73482)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function canonicalizeJsonValue(e) {
    if (Array.isArray(e)) return e.map(canonicalizeJsonValue);
    if (e && typeof e == "object") {
        let t = e;
        return Object.fromEntries(Object.keys(t).sort().map(n => [n, canonicalizeJsonValue(t[n])]))
    }
    return e
}
