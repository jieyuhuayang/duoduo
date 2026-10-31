// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: wsDefaultMaxPayload  (minified: WSt, daemon.pretty.js:93547)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.8.7 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 2 renamed — 1 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function wsDefaultMaxPayload() {
    let probeServer = new _U.default({
            noServer: !0
        }),
        maxPayload = probeServer.options.maxPayload;
    return probeServer.close(), maxPayload
}
