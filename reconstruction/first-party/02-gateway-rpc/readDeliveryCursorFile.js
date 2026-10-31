// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: readDeliveryCursorFile  (minified: rwe, daemon.pretty.js:65702)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.3.0, v0.8.0 (maps/history_daemon.json)
// locals: 12 renamed — 3 from the code at the binding (rule), 9 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function readDeliveryCursorFile(paths, sessionKey, consumerId) {
    let deliveryCursorPath = resolveDeliveryCursorPath(paths, sessionKey, consumerId);
    try {
        let content = await jdt.readFile(deliveryCursorPath, "utf8"),
            parsed = JSON.parse(content);
        if (parsed.session_key !== sessionKey) return null;
        let optimisticLastOutboxId = typeof parsed.optimistic_last_outbox_id == "string" ? parsed.optimistic_last_outbox_id : typeof parsed.last_outbox_id == "string" ? parsed.last_outbox_id : void 0,
            optimisticLastOutboxCreatedAt = typeof parsed.optimistic_last_outbox_created_at == "string" ? parsed.optimistic_last_outbox_created_at : typeof parsed.last_outbox_created_at == "string" ? parsed.last_outbox_created_at : void 0,
            ackLastOutboxId = typeof parsed.ack_last_outbox_id == "string" ? parsed.ack_last_outbox_id : void 0,
            ackLastOutboxCreatedAt = typeof parsed.ack_last_outbox_created_at == "string" ? parsed.ack_last_outbox_created_at : void 0,
            optimisticReplayOffset = typeof parsed.optimistic_replay_offset == "number" ? parsed.optimistic_replay_offset : void 0,
            ackReplayOffset = typeof parsed.ack_replay_offset == "number" ? parsed.ack_replay_offset : void 0;
        return {
            session_key: parsed.session_key,
            consumer_id: typeof parsed.consumer_id == "string" ? parsed.consumer_id : consumerId,
            optimistic_last_outbox_id: optimisticLastOutboxId,
            optimistic_last_outbox_created_at: optimisticLastOutboxCreatedAt,
            optimistic_replay_offset: optimisticReplayOffset,
            ack_last_outbox_id: ackLastOutboxId,
            ack_last_outbox_created_at: ackLastOutboxCreatedAt,
            ack_replay_offset: ackReplayOffset,
            updated_at: typeof parsed.updated_at == "string" ? parsed.updated_at : new Date().toISOString()
        }
    } catch {
        return null
    }
}
