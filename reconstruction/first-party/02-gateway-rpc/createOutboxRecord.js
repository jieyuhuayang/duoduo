// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: createOutboxRecord  (minified: Ba, daemon.pretty.js:36044)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createOutboxRecord(e, t = new Date) {
    let n = generateOutboxRecordId();
    return {
        ...e,
        id: n,
        idempotency_key: n,
        created_at: t.toISOString(),
        status: "pending",
        attempts: 0,
        last_attempt_at: null,
        last_error: null
    }
}
