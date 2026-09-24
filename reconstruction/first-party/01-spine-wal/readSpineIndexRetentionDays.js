// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: readSpineIndexRetentionDays  (minified: ose, daemon.pretty.js:32173)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function readSpineIndexRetentionDays(e = process.env) {
    let t = e[rse];
    if (t === void 0 || t.trim() === "") return pz;
    let n = Number(t);
    return Number.isInteger(n) && n >= 1 ? n : (Z(`[spine] ${rse}=${JSON.stringify(t)} is not a positive integer; using ${pz}`), pz)
}
