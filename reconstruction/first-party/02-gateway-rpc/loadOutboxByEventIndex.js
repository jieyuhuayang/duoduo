// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: loadOutboxByEventIndex  (minified: iit, daemon.pretty.js:38278)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.8.0 (maps/history_daemon.json)
// locals: 6 renamed — 2 from the code at the binding (rule), 4 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function loadOutboxByEventIndex(paths) {
    let indexCache = rit(paths);
    return await memoizeIndexLoad(indexCache, async () => {
        let outboxByEventIndexPath = resolveOutboxByEventIndexPath(paths);
        try {
            let stream = Nq(outboxByEventIndexPath);
            for await (let line of iterateStreamLines(stream)) if (line) try {
                let parsed = JSON.parse(line);
                parsed?.event_id && indexCache.map.set(parsed.event_id, parsed)
            } catch {
                continue
            }
        } catch {}
    }, () => {
        indexCache.map.clear()
    }), indexCache.map
}
