// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: readSpineIndexRetentionDays  (minified: Sae, daemon.pretty.js:32276)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.8.0 (high): The by-id index is now a bounded recency cache keyed on event date and compacted at boot (`ALADUO_SPINE_INDEX_RETENTION_DAYS`, 7 days by default).
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function readSpineIndexRetentionDays(e = process.env) {
    let t = e[vae];
    if (t === void 0 || t.trim() === "") return mU;
    let n = Number(t);
    return Number.isInteger(n) && n >= 1 ? n : (logWarnMessage(`[spine] ${vae}=${JSON.stringify(t)} is not a positive integer; using ${mU}`), mU)
}
