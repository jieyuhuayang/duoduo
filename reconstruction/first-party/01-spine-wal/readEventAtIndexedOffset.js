// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: readEventAtIndexedOffset  (minified: Y8e, daemon.pretty.js:32163)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.3.1 — first release whose bundle holds this declaration; body changed in v0.8.0 (maps/history_daemon.json)
// locals: 9 renamed — 2 from the code at the binding (rule), 7 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.3.1 (medium): Cross-cutting runtime I/O optimizations — caching, append-only mailbox, sharded registry, and lazy reads across hot paths.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function readEventAtIndexedOffset(paths, indexEntry, eventId) {
    let partitionPath = FR.join(paths.eventsDir, indexEntry.partition),
        handle = await LR.open(partitionPath, "r");
    try {
        let buffer = Buffer.alloc(indexEntry.byte_len),
            {
                bytesRead
            } = await handle.read(buffer, 0, indexEntry.byte_len, indexEntry.byte_offset),
            trimmed = buffer.subarray(0, bytesRead).toString("utf8").trim();
        if (trimmed) {
            let event = nYe(trimmed, eventId);
            if (event) return event
        }
    } finally {
        await handle.close()
    }
    return findEventInPartitionFile(partitionPath, eventId)
}
