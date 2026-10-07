// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: readPartitionByteRange  (minified: pH, daemon.pretty.js:89326)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.2 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.8.2 (medium): bounds event tail reads.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function readPartitionByteRange(e, t, n) {
    let r = Buffer.allocUnsafe(n - t),
        i = 0;
    for (; i < r.length;) {
        let {
            bytesRead: o
        } = await e.read(r, i, r.length - i, t + i);
        if (o === 0) break;
        i += o
    }
    return r.subarray(0, i)
}
