// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: listRetryableOutboxRecords  (minified: Mfe, daemon.pretty.js:38782)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.3.1 — first release whose bundle holds this declaration; body changed in v0.8.0 (maps/history_daemon.json)
// locals: 8 renamed — 2 from the code at the binding (rule), 6 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function listRetryableOutboxRecords(paths, maxAttempts = 5) {
    let pendingQueue = await Dfe(paths),
        records = [];
    for (let queueEntry of pendingQueue.values()) {
        if (queueEntry.status === "failed" && queueEntry.attempts >= maxAttempts || queueEntry.status !== "pending" && queueEntry.status !== "failed") continue;
        let outboxRecord = await readOutboxRecord(paths, queueEntry.channel_kind, queueEntry.record_id);
        if (outboxRecord) {
            if (outboxRecord.status !== "pending" && outboxRecord.status !== "failed") {
                let outboxPendingQueuePath = resolveOutboxPendingQueuePath(paths),
                    queueCache = gh.get(outboxPendingQueuePath);
                queueCache?.load && queueCache.map.delete(queueEntry.record_id);
                continue
            }
            outboxRecord.status === "failed" && outboxRecord.attempts >= maxAttempts || records.push(outboxRecord)
        }
    }
    return records
}
