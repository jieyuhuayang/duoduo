// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: filterDeliverableSessions  (minified: Kdt, daemon.pretty.js:66179)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.4 — first release whose bundle holds this declaration; body changed in v0.8.7 (maps/history_daemon.json)
// locals: 5 renamed — 0 from the code at the binding (rule), 5 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.4 (high): `session.list` accepts `deliverable: true` to list only the sessions a `Notify` would deliver to.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function filterDeliverableSessions(paths, sessions, finalSubscriberCount) {
    let deliverable = [];
    for (let session of sessions)(await evaluateNotifyConsumerRefusal(paths, session.session_key, finalSubscriberCount)).refused || deliverable.push(session);
    return deliverable
}
