// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: advanceOptimisticDeliveryCursor  (minified: L6, daemon.pretty.js:64475)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.3.0 — first release whose bundle holds this declaration; body changed in v0.5.6, v0.8.0 (maps/history_daemon.json)
// locals: 7 renamed — 1 from the code at the binding (rule), 6 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.3.0 (medium): **replay**: Harden session-local cursor fallback and recovery when replay indexes are incomplete or stale.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function advanceOptimisticDeliveryCursor(paths, sessionKey, consumerId, record) {
    let replayOffset = await Fbe(paths, record.id),
        now = Date.now();
    await updateDeliveryCursorFile(paths, sessionKey, consumerId, cursor => cursor && !YC(cursor.optimistic_last_outbox_created_at, cursor.optimistic_last_outbox_id, record) ? null : {
        session_key: sessionKey,
        consumer_id: consumerId,
        optimistic_last_outbox_id: record.id,
        optimistic_last_outbox_created_at: record.created_at,
        optimistic_replay_offset: replayOffset,
        ack_last_outbox_id: cursor?.ack_last_outbox_id,
        ack_last_outbox_created_at: cursor?.ack_last_outbox_created_at,
        ack_replay_offset: cursor?.ack_replay_offset,
        updated_at: new Date().toISOString()
    }) && await recordTelemetryMetric(paths, "cursor_store_ms", Date.now() - now, {
        sessionKey,
        consumerId,
        cursorKind: "optimistic"
    })
}
