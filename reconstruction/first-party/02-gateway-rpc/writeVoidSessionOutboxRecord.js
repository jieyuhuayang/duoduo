// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: writeVoidSessionOutboxRecord  (minified: wI, daemon.pretty.js:36981)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.4 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.8.4 (high): A new runtime value, `void`, for channel plugins whose sessions never run a model. A message to a void session is written to the spine and the outbox and wakes nothing.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function writeVoidSessionOutboxRecord(e, t, n) {
    let r = createOutboxRecord({
        channel_kind: n.sessionKey.split(":")[0],
        session_key: n.sessionKey,
        payload: {
            text: n.text,
            ...n.attachments && n.attachments.length > 0 ? {
                attachments: n.attachments
            } : {},
            data: n.data
        }
    });
    return await persistOutboxRecord(e, r), t?.emit("session.output", {
        sessionKey: n.sessionKey,
        record: r
    }), r
}
