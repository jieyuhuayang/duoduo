// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: loadEventIdIndex  (minified: YQe, daemon.pretty.js:34307)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.8.0, v0.8.2 (maps/history_daemon.json)
// locals: 7 renamed — 4 from the code at the binding (rule), 3 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function loadEventIdIndex(paths) {
    let eventIdIndexCache = getOrCreateEventIdIndexCache(paths);
    return await memoizeIndexLoad(eventIdIndexCache, async () => {
        let eventIdIndexPath = resolveEventIdIndexPath(paths);
        try {
            let stream = KU(eventIdIndexPath);
            for await (let line of iterateStreamLines(stream)) if (line) try {
                let parsed = JSON.parse(line);
                isUsableEventIndexEntry(parsed) && eventIdIndexCache.map.set(parsed.event_id, parsed)
            } catch {
                continue
            }
        } catch (err) {
            if (err.code === "ENOENT") return;
            throw err
        }
    }, () => {
        eventIdIndexCache.map.clear()
    }), eventIdIndexCache.map
}
