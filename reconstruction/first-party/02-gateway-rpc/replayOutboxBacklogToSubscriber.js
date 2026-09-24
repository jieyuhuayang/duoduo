// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: replayOutboxBacklogToSubscriber  (minified: R_e, daemon.pretty.js:64729)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function replayOutboxBacklogToSubscriber(e) {
    let {
        paths: t,
        sessionKey: n,
        consumerId: r,
        send: i,
        onDelivered: o,
        limit: s,
        cursorOverride: a
    } = e, u = await readOutboxRecordsPastCursor({
        paths: t,
        sessionKey: n,
        consumerId: r,
        limit: s,
        cursorOverride: a
    });
    for (let l of u) i({
        jsonrpc: "2.0",
        method: "session.output",
        params: {
            session_key: n,
            record: l
        }
    }), o && await o(l);
    return u.length
}
