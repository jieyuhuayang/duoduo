// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: readEventById  (minified: No, daemon.pretty.js:34237)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.3.1 — first release whose bundle holds this declaration; body changed in v0.8.0 (maps/history_daemon.json)
// locals: 5 renamed — 2 from the code at the binding (rule), 3 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.3.1 (medium): Cross-cutting runtime I/O optimizations — caching, append-only mailbox, sharded registry, and lazy reads across hot paths.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function readEventById(paths, eventId, scanOptions) {
    let eventIdIndexEntry = await lookupEventIdIndexEntry(paths, eventId);
    if (eventIdIndexEntry) {
        let eventAtIndexedOffset = await readEventAtIndexedOffset(paths, eventIdIndexEntry, eventId);
        if (eventAtIndexedOffset) return eventAtIndexedOffset
    }
    return scanOptions ? scanPartitionsForEventId(paths, eventId, scanOptions) : null
}
