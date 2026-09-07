// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: resolveCadenceIntervalMs  (minified: Ege, daemon.pretty.js:62108)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveCadenceIntervalMs() {
    let e = process.env.ALADUO_CADENCE_INTERVAL_MS;
    if (!e || e.trim() === "") return ah;
    let t = Number(e);
    return !Number.isFinite(t) || !Number.isInteger(t) || t < 1e3 ? ah : t
}
