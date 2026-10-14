// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: readSpineIndexRetentionDays  (minified: kae, daemon.pretty.js:32276)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 3 renamed — 0 from the code at the binding (rule), 3 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.0 (high): The by-id index is now a bounded recency cache keyed on event date and compacted at boot (`ALADUO_SPINE_INDEX_RETENTION_DAYS`, 7 days by default).
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function readSpineIndexRetentionDays(env = process.env) {
    let rawValue = env[wae];
    if (rawValue === void 0 || rawValue.trim() === "") return mU;
    let days = Number(rawValue);
    return Number.isInteger(days) && days >= 1 ? days : (logWarnMessage(`[spine] ${wae}=${JSON.stringify(rawValue)} is not a positive integer; using ${mU}`), mU)
}
