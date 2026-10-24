// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: findOutboxRecordByEventId  (minified: yh, daemon.pretty.js:38229)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.8.0 (maps/history_daemon.json)
// locals: 4 renamed — 1 from the code at the binding (rule), 3 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function findOutboxRecordByEventId(paths, eventId) {
    let indexEntry = (await loadOutboxByEventIndex(paths)).get(eventId);
    if (indexEntry) {
        let outboxRecord = await readOutboxRecord(paths, indexEntry.channel_kind, indexEntry.record_id);
        if (outboxRecord) return outboxRecord
    }
    return null
}
