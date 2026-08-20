// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: readEventByIdSeek  (minified: zc, daemon.pretty.js:31313)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function readEventByIdSeek(e, t) {
    let n = await Hj(e, t);
    if (!n) return null;
    let r = qx.join(e.eventsDir, n.partition),
        i = await Ux.open(r, "r");
    try {
        let o = Buffer.alloc(n.byte_len),
            {
                bytesRead: s
            } = await i.read(o, 0, n.byte_len, n.byte_offset),
            a = o.subarray(0, s).toString("utf8").trim();
        if (!a) return null;
        let l = eVe(a, t);
        if (l) return l
    } finally {
        await i.close()
    }
    return tVe(r, t)
}
