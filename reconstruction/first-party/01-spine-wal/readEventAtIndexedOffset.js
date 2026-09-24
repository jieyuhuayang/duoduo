// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: readEventAtIndexedOffset  (minified: e5e, daemon.pretty.js:32060)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function readEventAtIndexedOffset(e, t, n) {
    let r = sR.join(e.eventsDir, t.partition),
        i = await oR.open(r, "r");
    try {
        let o = Buffer.alloc(t.byte_len),
            {
                bytesRead: s
            } = await i.read(o, 0, t.byte_len, t.byte_offset),
            a = o.subarray(0, s).toString("utf8").trim();
        if (a) {
            let u = o5e(a, n);
            if (u) return u
        }
    } finally {
        await i.close()
    }
    return findEventInPartitionFile(r, n)
}
