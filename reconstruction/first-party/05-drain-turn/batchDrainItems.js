// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: batchDrainItems  (minified: LW, daemon.pretty.js:72110)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.3.0, v0.5.5, v0.8.0, v0.8.1 (maps/history_daemon.json)
// locals: 12 renamed — 2 from the code at the binding (rule), 10 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function batchDrainItems(paths, items, options) {
    if (items.length === 0) return {
        items: [],
        events: new Map
    };
    let map = new Map,
        batch = [],
        lastTs = null,
        timestampsKnown = !0,
        batchClass = OW,
        maxBatchSize = () => Ymt(batchClass) ? Number.POSITIVE_INFINITY : options.fallbackBatchSize;
    for (let item of items) {
        if (batch.length >= maxBatchSize()) break;
        let drainItemEvent = await loadDrainItemEventCached(paths, item, map, options.perf);
        if (drainItemEvent && extractJobCompletionJobId(drainItemEvent) !== null) continue;
        if (batch.length === 0) {
            batchClass = classifyDrainBatchClass(drainItemEvent), batch.push(item), lastTs = drainItemEvent ? parseEventTimestampMs(drainItemEvent.ts) : null, lastTs === null && (timestampsKnown = !1);
            continue
        }
        if (classifyDrainBatchClass(drainItemEvent) !== batchClass) break;
        if (!timestampsKnown) {
            batch.push(item);
            continue
        }
        let eventTs = drainItemEvent ? parseEventTimestampMs(drainItemEvent.ts) : null;
        if (lastTs === null || eventTs === null) {
            timestampsKnown = !1, batch.push(item);
            continue
        }
        if (Math.abs(eventTs - lastTs) > options.mergeWindowMs) break;
        batch.push(item), lastTs = eventTs
    }
    return {
        items: batch,
        events: map
    }
}
