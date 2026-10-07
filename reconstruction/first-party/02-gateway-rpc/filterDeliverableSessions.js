// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: filterDeliverableSessions  (minified: Olt, daemon.pretty.js:64885)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function filterDeliverableSessions(e, t) {
    let n = [];
    for (let r of t)(await evaluateNotifyConsumerRefusal(e, r.session_key)).refused || n.push(r);
    return n
}
