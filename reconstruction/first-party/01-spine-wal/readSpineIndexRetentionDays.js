// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: readSpineIndexRetentionDays  (minified: Sae, daemon.pretty.js:32276)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function readSpineIndexRetentionDays(e = process.env) {
    let t = e[vae];
    if (t === void 0 || t.trim() === "") return mU;
    let n = Number(t);
    return Number.isInteger(n) && n >= 1 ? n : (logWarnMessage(`[spine] ${vae}=${JSON.stringify(t)} is not a positive integer; using ${mU}`), mU)
}
