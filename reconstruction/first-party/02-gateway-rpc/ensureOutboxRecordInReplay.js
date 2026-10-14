// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: ensureOutboxRecordInReplay  (minified: met, daemon.pretty.js:36373)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.3.0 — first release whose bundle holds this declaration; body changed in v0.3.1 (maps/history_daemon.json)
// locals: 4 renamed — 1 from the code at the binding (rule), 3 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.3.0 (medium): **runtime**: Split outbox replay bootstrap read/write paths so live appends no longer rebuild replay artifacts on every write.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function ensureOutboxRecordInReplay(paths, record) {
    return Lce(record.session_key, async () => {
        await zce(paths, record.session_key, !1);
        let outboxByIdIndexEntry = await lookupOutboxByIdIndexEntry(paths, record.id);
        if (outboxByIdIndexEntry) return await Yb(paths, record.session_key, resolveOutboxReplayFilePath(paths, record.session_key)), outboxByIdIndexEntry;
        let indexEntry = await pet(paths, record);
        return await Yb(paths, record.session_key, resolveOutboxReplayFilePath(paths, record.session_key)), indexEntry
    })
}
