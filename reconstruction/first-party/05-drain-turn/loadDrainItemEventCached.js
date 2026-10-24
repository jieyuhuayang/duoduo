// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: loadDrainItemEventCached  (minified: zEe, daemon.pretty.js:74229)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.3.0, v0.5.5, v0.8.0 (maps/history_daemon.json)
// locals: 8 renamed — 1 from the code at the binding (rule), 7 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function loadDrainItemEventCached(paths, item, cache, perf) {
    if (!item.eventId) return null;
    let eventId = item.eventId,
        cached = cache.get(eventId);
    if (cached) return cached;
    let readOptions = item.createdAt ? {
            notAfter: item.createdAt
        } : void 0,
        event = await runTimedDrainPhase(perf, "event_read_ms", async () => readEventById(paths, eventId, readOptions));
    return event ? (cache.set(eventId, event), event) : null
}
