// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: lookupEventIdIndexEntry  (minified: qb, daemon.pretty.js:33396)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.8.0, v0.8.2 (maps/history_daemon.json)
// locals: 6 renamed — 1 from the code at the binding (rule), 5 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.2 (medium): guards the by-id index against out-of-range lookups.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function lookupEventIdIndexEntry(paths, eventId, options) {
    if (options?.load === !1) {
        let cache = QR.get(resolveEventIdIndexPath(paths));
        return !cache || !await isIndexLoadStillCurrent(cache) ? null : cache.map.get(eventId) ?? null
    }
    let index;
    try {
        index = await loadEventIdIndex(paths)
    } catch (err) {
        return logWarnMessage(`[spine] by-id index load failed; treating ${eventId} as an index miss`, err), null
    }
    return index.get(eventId) ?? null
}
