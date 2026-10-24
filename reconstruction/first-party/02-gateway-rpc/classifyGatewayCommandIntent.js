// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: classifyGatewayCommandIntent  (minified: Gq, daemon.pretty.js:89624)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.5.2, v0.5.6, v0.5.7, v0.6.0, v0.8.0 (maps/history_daemon.json)
// locals: 1 renamed — 0 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.2 (medium): `/compact` and `/undo` work everywhere.
// changelog v0.5.6 (medium): Type `/model` to list available models, `/model <id>` to switch the running session
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function classifyGatewayCommandIntent(command) {
    if (command) {
        if (command.name === "/status") return "status";
        if (command.name === "/config") return "config";
        if (command.name === "/debug") return "debug";
        if (command.name === "/cancel" || command.name === "/clear") return "execute";
        if (command.name === "/compact") return "history-control";
        if (command.name === "/stats") return "status";
        if (command.name === "/model" || command.name === "/effort") return "config";
        if (command.name === "/task") return command.raw.includes("kill") ? "execute" : "status"
    }
}
