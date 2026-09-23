// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: resolveCadenceIntervalMs  (minified: kwe, daemon.pretty.js:68552)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveCadenceIntervalMs() {
    let e = process.env.ALADUO_CADENCE_INTERVAL_MS;
    if (!e || e.trim() === "") return bg;
    let t = Number(e);
    return !Number.isFinite(t) || !Number.isInteger(t) || t < 1e3 ? bg : t
}
