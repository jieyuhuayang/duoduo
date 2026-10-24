// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: replayOutboxBacklogToSubscriber  (minified: Mwe, daemon.pretty.js:66715)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 10 renamed — 8 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function replayOutboxBacklogToSubscriber(options) {
    let {
        paths,
        sessionKey,
        consumerId,
        send,
        onDelivered,
        limit,
        cursorOverride
    } = options, outboxRecordsPastCursor = await readOutboxRecordsPastCursor({
        paths,
        sessionKey,
        consumerId,
        limit,
        cursorOverride
    });
    for (let record of outboxRecordsPastCursor) send({
        jsonrpc: "2.0",
        method: "session.output",
        params: {
            session_key: sessionKey,
            record
        }
    }), onDelivered && await onDelivered(record);
    return outboxRecordsPastCursor.length
}
