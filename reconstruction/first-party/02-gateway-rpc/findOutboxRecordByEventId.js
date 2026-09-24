// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: findOutboxRecordByEventId  (minified: qm, daemon.pretty.js:36021)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function findOutboxRecordByEventId(e, t) {
    let r = (await loadOutboxByEventIndex(e)).get(t);
    if (r) {
        let i = await readOutboxRecord(e, r.channel_kind, r.record_id);
        if (i) return i
    }
    return null
}
