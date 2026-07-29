// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: atomicAppendEvent  (minified: tn, daemon.pretty.js:30720)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function atomicAppendEvent(e, t) {
    let n = await atomicWriteFileSync(e, t);
    return await T2e(e, {
        event_id: n.event.id,
        partition: n.partition,
        byte_offset: n.byteOffset,
        byte_len: n.byteLength
    }), t.session_key && await XQ(e, {
        session_key: t.session_key,
        event_id: n.event.id,
        partition: n.partition,
        byte_offset: n.byteOffset,
        byte_len: n.byteLength,
        ts: t.ts
    }), n
}
