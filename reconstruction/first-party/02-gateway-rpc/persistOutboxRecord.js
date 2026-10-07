// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: persistOutboxRecord  (minified: Va, daemon.pretty.js:36076)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function persistOutboxRecord(e, t) {
    await eet(e, t), t.in_reply_to_event_id && await tq(e, t.in_reply_to_event_id, t);
    try {
        await ensureOutboxRecordInReplay(e, t)
    } catch {}
}
