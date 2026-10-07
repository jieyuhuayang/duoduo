// duoduo reconstruction — subsystem: 00-daemon-entry
// symbol: readEnvIntegerOrFallback  (minified: wIe, daemon.pretty.js:90501)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function readEnvIntegerOrFallback(e, t, n) {
    let r = process.env[e];
    if (!r || r.trim() === "") return t;
    let i = Number(r);
    return !Number.isFinite(i) || !Number.isInteger(i) || i < n ? (logWarnMessage("[pid0] invalid env integer, using fallback", {
        name: e,
        value: r,
        fallback: t,
        min: n
    }), t) : i
}
