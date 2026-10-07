// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: classifyGatewayCommandIntent  (minified: mq, daemon.pretty.js:87496)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.5.2, v0.5.6, v0.5.7, v0.6.0, v0.8.0 (maps/history_daemon.json)
// changelog v0.5.2 (medium): `/compact` and `/undo` work everywhere.
// changelog v0.5.6 (medium): Type `/model` to list available models, `/model <id>` to switch the running session
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
