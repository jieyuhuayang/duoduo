// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: getOrCreateEventIdIndexCache  (minified: Q8e, daemon.pretty.js:32212)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.8.0 (maps/history_daemon.json)
// locals: 4 renamed — 1 from the code at the binding (rule), 3 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function getOrCreateEventIdIndexCache(paths) {
    let eventIdIndexPath = resolveEventIdIndexPath(paths),
        existing = jR.get(eventIdIndexPath);
    if (existing) return existing;
    let cache = {
        map: new Map
    };
    return jR.set(eventIdIndexPath, cache), cache
}
