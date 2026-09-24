// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: isJsonRpcRequest  (minified: eb, daemon.pretty.js:31516)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isJsonRpcRequest(e) {
    if (!e || typeof e != "object") return !1;
    let t = e;
    return t.jsonrpc === "2.0" && typeof t.method == "string"
}
