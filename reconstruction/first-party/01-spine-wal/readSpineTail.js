// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: readSpineTail  (minified: wwe, daemon.pretty.js:89404)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.3.2 — first release whose bundle holds this declaration; body changed in v0.8.2 (maps/history_daemon.json)
// locals: 8 renamed — 3 from the code at the binding (rule), 5 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.3.2 (high): **protocol**: Add `system.status` RPC (health, sessions, subconscious playlist) and `spine.tail` RPC (last N events with incremental `after_id` cursor and cross-midnight boundary support).
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function readSpineTail(paths, options, now = new Date) {
    let limit = Math.min(Math.max(options?.limit ?? 200, 1), 500),
        afterId = options?.after_id,
        partitionTail = await readPartitionTail(paths, `${now.toISOString().slice(0,10)}.jsonl`, limit, afterId);
    if (!afterId || partitionTail.foundCursor || partitionTail.has_more) return {
        events: partitionTail.events,
        has_more: partitionTail.has_more
    };
    let date = new Date(now);
    date.setUTCDate(date.getUTCDate() - 1);
    let partitionTail2 = await readPartitionTail(paths, `${date.toISOString().slice(0,10)}.jsonl`, limit - partitionTail.events.length, afterId, !0);
    return partitionTail2.foundCursor ? {
        events: [...partitionTail2.events, ...partitionTail.events],
        has_more: partitionTail2.has_more
    } : {
        events: partitionTail.events,
        has_more: partitionTail.has_more
    }
}
