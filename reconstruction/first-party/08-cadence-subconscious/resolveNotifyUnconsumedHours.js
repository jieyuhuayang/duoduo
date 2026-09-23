// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: resolveNotifyUnconsumedHours  (minified: BV, daemon.pretty.js:64856)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveNotifyUnconsumedHours(e = process.env) {
    let t = e[qV];
    if (t === void 0 || t === "") return R$;
    let n = Number(t);
    return Number.isFinite(n) ? n : R$
}
