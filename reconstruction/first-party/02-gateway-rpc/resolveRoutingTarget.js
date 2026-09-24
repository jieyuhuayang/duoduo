// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: resolveRoutingTarget  (minified: jXe, daemon.pretty.js:87155)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveRoutingTarget(e, t, n) {
    if (e.routingHint?.target) return e.routingHint.target;
    if (n) return n.args ? "session" : "gateway";
    let r = classifyGatewayCommandIntent(t);
    return (e.routingHint?.intent ?? r) === "history-control" ? "session" : e.routingHint?.intent === "status" || e.routingHint?.intent === "config" || e.routingHint?.intent === "debug" || r ? "gateway" : "session"
}
