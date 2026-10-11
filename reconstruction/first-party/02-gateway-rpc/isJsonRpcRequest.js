// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: isJsonRpcRequest  (minified: Sb, daemon.pretty.js:31516)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 2 renamed — 0 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isJsonRpcRequest(message) {
    if (!message || typeof message != "object") return !1;
    let request = message;
    return request.jsonrpc === "2.0" && typeof request.method == "string"
}
