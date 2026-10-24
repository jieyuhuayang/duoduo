// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: appendEventIdIndexEntry  (minified: WQe, daemon.pretty.js:34219)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.8.0 (maps/history_daemon.json)
// locals: 5 renamed — 1 from the code at the binding (rule), 4 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.0 (medium): The by-id index is now a bounded recency cache keyed on event date and compacted at boot (`ALADUO_SPINE_INDEX_RETENTION_DAYS`, 7 days by default).
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function appendEventIdIndexEntry(paths, entry) {
    await ensureDirectoryExists(paths.eventsIndexDir);
    let line = `${stringifyJsonlRecord(entry)}
`,
        eventIdIndexPath = resolveEventIdIndexPath(paths);
    await eI.appendFile(eventIdIndexPath, line);
    let cache = QR.get(eventIdIndexPath);
    cache && await isIndexLoadStillCurrent(cache) && cache.map.set(entry.event_id, entry)
}
