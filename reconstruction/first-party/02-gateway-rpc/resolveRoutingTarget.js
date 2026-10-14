// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: resolveRoutingTarget  (minified: Met, daemon.pretty.js:87555)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.5.2, v0.5.6, v0.5.7, v0.6.0 (maps/history_daemon.json)
// locals: 4 renamed — 0 from the code at the binding (rule), 4 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveRoutingTarget(message, gatewayCommand, injectionCommand) {
    if (message.routingHint?.target) return message.routingHint.target;
    if (injectionCommand) return injectionCommand.args ? "session" : "gateway";
    let commandIntent = classifyGatewayCommandIntent(gatewayCommand);
    return (message.routingHint?.intent ?? commandIntent) === "history-control" ? "session" : message.routingHint?.intent === "status" || message.routingHint?.intent === "config" || message.routingHint?.intent === "debug" || commandIntent ? "gateway" : "session"
}
