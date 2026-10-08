// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: indexOutboxRecordByEventId  (minified: tq, daemon.pretty.js:36082)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function indexOutboxRecordByEventId(e, t, n) {
    await appendOutboxByEventIndexEntry(e, {
        event_id: t,
        channel_kind: n.channel_kind,
        record_id: n.id,
        created_at: n.created_at
    })
}
