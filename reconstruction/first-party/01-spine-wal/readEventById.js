// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: readEventById  (minified: Oo, daemon.pretty.js:32155)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.3.1 — first release whose bundle holds this declaration; body changed in v0.8.0 (maps/history_daemon.json)
// changelog v0.3.1 (medium): Cross-cutting runtime I/O optimizations — caching, append-only mailbox, sharded registry, and lazy reads across hot paths.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function readEventById(e, t, n) {
    let r = await lookupEventIdIndexEntry(e, t);
    if (r) {
        let i = await readEventAtIndexedOffset(e, r, t);
        if (i) return i
    }
    return n ? scanPartitionsForEventId(e, t, n) : null
}
