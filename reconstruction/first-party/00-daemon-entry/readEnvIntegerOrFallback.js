// duoduo reconstruction — subsystem: 00-daemon-entry
// symbol: readEnvIntegerOrFallback  (minified: C0e, daemon.pretty.js:89082)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function readEnvIntegerOrFallback(e, t, n) {
    let r = process.env[e];
    if (!r || r.trim() === "") return t;
    let i = Number(r);
    return !Number.isFinite(i) || !Number.isInteger(i) || i < n ? (Z("[pid0] invalid env integer, using fallback", {
        name: e,
        value: r,
        fallback: t,
        min: n
    }), t) : i
}
