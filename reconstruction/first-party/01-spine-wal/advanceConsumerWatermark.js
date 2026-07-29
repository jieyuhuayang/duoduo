// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: advanceConsumerWatermark  (minified: Ca, daemon.pretty.js:31543)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function advanceConsumerWatermark(e, t, n, r = new Date) {
    let i = await c1(e, n);
    return i ? (await o4e(e, t, {
        updated_at: r.toISOString(),
        partition: i.partition,
        byte_offset: i.byte_offset,
        last_event_id: n
    }), !0) : !1
}
