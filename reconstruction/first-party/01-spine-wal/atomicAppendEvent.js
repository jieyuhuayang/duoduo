// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: atomicAppendEvent  (minified: en, daemon.pretty.js:31474)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function atomicAppendEvent(e, t) {
    let n = await atomicWriteFileSync(e, t);
    return await mJe(e, {
        event_id: n.event.id,
        partition: n.partition,
        byte_offset: n.byteOffset,
        byte_len: n.byteLength
    }), n
}
