// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: collectJobCompletionReceipts  (minified: tht, daemon.pretty.js:72246)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.1 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 15 renamed — 3 from the code at the binding (rule), 12 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.1 (medium): A finished job's completion receipt now arrives as context on the owner's next turn instead of waking a turn of its own.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function collectJobCompletionReceipts(paths, renderOptions, items, eventCache, perf) {
    let map = new Map,
        eventIds = [];
    for (let item of items) {
        if (!item.eventId) continue;
        let drainItemEvent = await loadDrainItemEventCached(paths, item, eventCache, perf);
        if (!drainItemEvent) continue;
        let jobCompletionJobId = extractJobCompletionJobId(drainItemEvent);
        if (!jobCompletionJobId) continue;
        let entry = {
                item,
                event: drainItemEvent,
                prompt: renderMailboxEventPrompt(drainItemEvent, renderOptions)
            },
            group = map.get(jobCompletionJobId);
        group ? group.push(entry) : map.set(jobCompletionJobId, [entry]), eventIds.push(item.eventId)
    }
    if (map.size === 0) return null;
    let sections = [];
    for (let [jobId, entries] of map) sections.push(entries.length === 1 ? entries[0].prompt : eht(paths, renderOptions, jobId, entries));
    return {
        text: sections.join(`

`),
        eventIds
    }
}
