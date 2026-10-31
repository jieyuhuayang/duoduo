// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: recordOutboxDeliveryAttempt  (minified: vf, daemon.pretty.js:37368)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.3.1 (maps/history_daemon.json)
// locals: 6 renamed — 1 from the code at the binding (rule), 5 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function recordOutboxDeliveryAttempt(paths, record, attempt) {
    let attemptedAt = new Date().toISOString(),
        updatedRecord = {
            ...record,
            status: attempt.status,
            attempts: record.attempts + 1,
            last_attempt_at: attemptedAt,
            last_error: attempt.error ?? null
        },
        outboxRecordPath = resolveOutboxRecordPath(paths, record.channel_kind, record.id);
    await ensureDirectoryExists(qr.dirname(outboxRecordPath)), await writeJsonFileAtomic(outboxRecordPath, updatedRecord);
    try {
        attempt.status === "sent" ? await Ont(paths, record.id) : attempt.status === "failed" && await Ant(paths, {
            record_id: record.id,
            channel_kind: record.channel_kind,
            session_key: record.session_key,
            status: "failed",
            attempts: updatedRecord.attempts,
            created_at: record.created_at
        })
    } catch {}
    return updatedRecord
}
