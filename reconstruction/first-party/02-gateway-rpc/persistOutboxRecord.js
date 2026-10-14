// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: persistOutboxRecord  (minified: Va, daemon.pretty.js:36076)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.3.0 (maps/history_daemon.json)
// locals: 2 renamed — 0 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function persistOutboxRecord(paths, record) {
    await ret(paths, record), record.in_reply_to_event_id && await indexOutboxRecordByEventId(paths, record.in_reply_to_event_id, record);
    try {
        await ensureOutboxRecordInReplay(paths, record)
    } catch {}
}
