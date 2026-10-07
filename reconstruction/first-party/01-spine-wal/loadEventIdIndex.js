// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: loadEventIdIndex  (minified: X8e, daemon.pretty.js:32225)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function loadEventIdIndex(e) {
    let t = getOrCreateEventIdIndexCache(e);
    return await memoizeIndexLoad(t, async () => {
        let n = resolveEventIdIndexPath(e);
        try {
            let r = gU(n);
            for await (let i of iterateStreamLines(r)) if (i) try {
                let o = JSON.parse(i);
                isUsableEventIndexEntry(o) && t.map.set(o.event_id, o)
            } catch {
                continue
            }
        } catch (r) {
            if (r.code === "ENOENT") return;
            throw r
        }
    }, () => {
        t.map.clear()
    }), t.map
}
