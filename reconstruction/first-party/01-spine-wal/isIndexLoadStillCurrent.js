// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: isIndexLoadStillCurrent  (minified: Uu, daemon.pretty.js:31944)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 2 renamed — 1 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function isIndexLoadStillCurrent(cache) {
    let load = cache.load;
    return load ? (await load.catch(() => {}), cache.load === load) : !1
}
