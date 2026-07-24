// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: readEventByIdSeek  (minified: ml, daemon.pretty.js:30732)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function readEventByIdSeek(e, t) {
    let n = await u1(e, t);
    if (!n) return null;
    let r = pk.join(e.eventsDir, n.partition),
        i = await fk.open(r, "r");
    try {
        let s = Buffer.alloc(n.byte_len),
            {
                bytesRead: o
            } = await i.read(s, 0, n.byte_len, n.byte_offset),
            a = s.subarray(0, o).toString("utf8").trim();
        if (!a) return null;
        let u = y2e(a, t);
        if (u) return u
    } finally {
        await i.close()
    }
    return _2e(r, t)
}
