// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: advanceConsumerWatermark  (minified: Nu, daemon.pretty.js:32858)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function advanceConsumerWatermark(e, t, n, r = new Date) {
    let i = await nb(e, n);
    return i ? (await $5e(e, t, {
        updated_at: r.toISOString(),
        partition: i.partition,
        byte_offset: i.byte_offset,
        last_event_id: n
    }), !0) : !1
}
