// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: canonicalizeGatewayCommand  (minified: hde, daemon.pretty.js:87488)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.5.2, v0.5.6, v0.5.7, v0.6.0, v0.8.0 (maps/history_daemon.json)
// locals: 1 renamed — 0 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.2 (medium): `/compact` and `/undo` work everywhere. Type them in any channel (Feishu DM, stdio, ACP editor).
// changelog v0.5.6 (high): Type `/model` to list available models ... Kick off a self-pacing loop with `/loop <task>`.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function canonicalizeGatewayCommand(commandName) {
    if (commandName === "/status") return "/status";
    if (commandName === "/config") return "/config";
    if (commandName === "/debug" || commandName === "#debug") return "/debug";
    if (commandName === "/cancel") return "/cancel";
    if (commandName === "/clear" || commandName === "/reset") return "/clear";
    if (commandName === "/stats") return "/stats";
    if (commandName === "/task") return "/task";
    if (commandName === "/compact") return "/compact";
    if (commandName === "/model") return "/model";
    if (commandName === "/effort") return "/effort"
}
