// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: resolveTailCursorEndOffset  (minified: Bct, daemon.pretty.js:89350)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.2 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.8.2 (medium): bounds event tail reads.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function resolveTailCursorEndOffset(e, t, n, r, i) {
    let o = await lookupEventIdIndexEntry(e, i, {
        load: !1
    });
    if (!o || o.partition !== t) return;
    let {
        byte_offset: s,
        byte_len: a
    } = o;
    if (!Number.isSafeInteger(s) || !Number.isSafeInteger(a) || s < 0 || a <= 0 || s + a > r || s > 0 && (await readPartitionByteRange(n, s - 1, s))[0] !== 10) return;
    let u = await readPartitionByteRange(n, s, s + a);
    if (!(u.length !== a || u[u.length - 1] !== 10)) try {
        if (JSON.parse(u.toString("utf8"))?.id === i) return s + a
    } catch {}
}
