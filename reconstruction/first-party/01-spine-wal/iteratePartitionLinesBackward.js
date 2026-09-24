// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: iteratePartitionLinesBackward  (minified: Jut, daemon.pretty.js:88957)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function* iteratePartitionLinesBackward(e, t, n, r) {
    let i = n,
        o = [];
    for (; i > t;) {
        let s = Math.max(t, i - r),
            a = await readPartitionByteRange(e, s, i),
            u = a.length;
        for (let l = a.length - 1; l >= 0; l--) a[l] === 10 && (o.push(a.subarray(l + 1, u)), yield Buffer.concat(o.reverse()).toString("utf8"), o = [], u = l);
        u > 0 && o.push(a.subarray(0, u)), i = s
    }
    o.length > 0 && (yield Buffer.concat(o.reverse()).toString("utf8"))
}
