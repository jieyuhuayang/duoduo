// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: advanceOptimisticDeliveryCursor  (minified: j6, daemon.pretty.js:64474)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.3.0 — first release whose bundle holds this declaration; body changed in v0.5.6, v0.8.0 (maps/history_daemon.json)
// changelog v0.3.0 (medium): **replay**: Harden session-local cursor fallback and recovery when replay indexes are incomplete or stale.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function advanceOptimisticDeliveryCursor(e, t, n, r) {
    let i = await Mbe(e, r.id),
        o = Date.now();
    await updateDeliveryCursorFile(e, t, n, a => a && !YC(a.optimistic_last_outbox_created_at, a.optimistic_last_outbox_id, r) ? null : {
        session_key: t,
        consumer_id: n,
        optimistic_last_outbox_id: r.id,
        optimistic_last_outbox_created_at: r.created_at,
        optimistic_replay_offset: i,
        ack_last_outbox_id: a?.ack_last_outbox_id,
        ack_last_outbox_created_at: a?.ack_last_outbox_created_at,
        ack_replay_offset: a?.ack_replay_offset,
        updated_at: new Date().toISOString()
    }) && await recordTelemetryMetric(e, "cursor_store_ms", Date.now() - o, {
        sessionKey: t,
        consumerId: n,
        cursorKind: "optimistic"
    })
}
