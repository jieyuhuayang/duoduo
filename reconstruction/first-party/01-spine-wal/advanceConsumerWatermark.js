// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: advanceConsumerWatermark  (minified: Bu, daemon.pretty.js:32961)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function advanceConsumerWatermark(e, t, n, r = new Date) {
    let i = await lookupEventIdIndexEntry(e, n);
    return i ? (await writeConsumerOffsetFile(e, t, {
        updated_at: r.toISOString(),
        partition: i.partition,
        byte_offset: i.byte_offset,
        last_event_id: n
    }), !0) : !1
}
