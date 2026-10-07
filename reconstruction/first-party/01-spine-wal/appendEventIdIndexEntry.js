// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: appendEventIdIndexEntry  (minified: J8e, daemon.pretty.js:32137)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.8.0 (maps/history_daemon.json)
// changelog v0.8.0 (medium): The by-id index is now a bounded recency cache keyed on event date and compacted at boot (`ALADUO_SPINE_INDEX_RETENTION_DAYS`, 7 days by default).
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function appendEventIdIndexEntry(e, t) {
    await ensureDirectoryExists(e.eventsIndexDir);
    let n = `${stringifyJsonlRecord(t)}
`,
        r = resolveEventIdIndexPath(e);
    await LR.appendFile(r, n);
    let i = jR.get(r);
    i && await isIndexLoadStillCurrent(i) && i.map.set(t.event_id, t)
}
