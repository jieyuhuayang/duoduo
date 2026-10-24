// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: hasUnqueuedPendingOutboxRecords  (minified: mit, daemon.pretty.js:38713)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.3.1 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 4 renamed — 1 from the code at the binding (rule), 3 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function hasUnqueuedPendingOutboxRecords(paths, queuedIds) {
    let allOutboxRecords = await listAllOutboxRecords(paths);
    for (let record of allOutboxRecords)
        if (!(record.status !== "pending" && record.status !== "failed") && !queuedIds.has(record.id)) return !0;
    return !1
}
