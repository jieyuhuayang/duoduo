// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: lookupEventIdIndexEntry  (minified: Ib, daemon.pretty.js:32198)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function lookupEventIdIndexEntry(e, t, n) {
    if (n?.load === !1) {
        let i = jR.get(resolveEventIdIndexPath(e));
        return !i || !await isIndexLoadStillCurrent(i) ? null : i.map.get(t) ?? null
    }
    let r;
    try {
        r = await loadEventIdIndex(e)
    } catch (i) {
        return logWarnMessage(`[spine] by-id index load failed; treating ${t} as an index miss`, i), null
    }
    return r.get(t) ?? null
}
