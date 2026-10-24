// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: advanceConsumerWatermark  (minified: Bu, daemon.pretty.js:35043)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 5 renamed — 1 from the code at the binding (rule), 4 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function advanceConsumerWatermark(paths, consumerId, eventId, now = new Date) {
    let eventIdIndexEntry = await lookupEventIdIndexEntry(paths, eventId);
    return eventIdIndexEntry ? (await writeConsumerOffsetFile(paths, consumerId, {
        updated_at: now.toISOString(),
        partition: eventIdIndexEntry.partition,
        byte_offset: eventIdIndexEntry.byte_offset,
        last_event_id: eventId
    }), !0) : !1
}
