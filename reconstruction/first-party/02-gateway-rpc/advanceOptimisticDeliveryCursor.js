// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: advanceOptimisticDeliveryCursor  (minified: zV, daemon.pretty.js:64571)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function advanceOptimisticDeliveryCursor(e, t, n, r) {
    let i = await w_e(e, r.id),
        o = Date.now();
    await updateDeliveryCursorFile(e, t, n, a => a && !k$(a.optimistic_last_outbox_created_at, a.optimistic_last_outbox_id, r) ? null : {
        session_key: t,
        consumer_id: n,
        optimistic_last_outbox_id: r.id,
        optimistic_last_outbox_created_at: r.created_at,
        optimistic_replay_offset: i,
        ack_last_outbox_id: a?.ack_last_outbox_id,
        ack_last_outbox_created_at: a?.ack_last_outbox_created_at,
        ack_replay_offset: a?.ack_replay_offset,
        updated_at: new Date().toISOString()
    }) && await ps(e, "cursor_store_ms", Date.now() - o, {
        sessionKey: t,
        consumerId: n,
        cursorKind: "optimistic"
    })
}
