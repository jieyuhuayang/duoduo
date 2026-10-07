// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: resolveNotifyUnconsumedHours  (minified: U6, daemon.pretty.js:64756)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveNotifyUnconsumedHours(e = process.env) {
    let t = e[z6];
    if (t === void 0 || t === "") return eO;
    let n = Number(t);
    return Number.isFinite(n) ? n : eO
}
