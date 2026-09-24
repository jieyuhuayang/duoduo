// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: classifyGatewayCommandIntent  (minified: fU, daemon.pretty.js:87142)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function classifyGatewayCommandIntent(e) {
    if (e) {
        if (e.name === "/status") return "status";
        if (e.name === "/config") return "config";
        if (e.name === "/debug") return "debug";
        if (e.name === "/cancel" || e.name === "/clear") return "execute";
        if (e.name === "/compact") return "history-control";
        if (e.name === "/stats") return "status";
        if (e.name === "/model" || e.name === "/effort") return "config";
        if (e.name === "/task") return e.raw.includes("kill") ? "execute" : "status"
    }
}
