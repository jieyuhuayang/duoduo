// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: canonicalizeGatewayCommand  (minified: mde, daemon.pretty.js:87442)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.5.2, v0.5.6, v0.5.7, v0.6.0, v0.8.0 (maps/history_daemon.json)
// changelog v0.5.2 (medium): `/compact` and `/undo` work everywhere. Type them in any channel (Feishu DM, stdio, ACP editor).
// changelog v0.5.6 (high): Type `/model` to list available models ... Kick off a self-pacing loop with `/loop <task>`.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function canonicalizeGatewayCommand(e) {
    if (e === "/status") return "/status";
    if (e === "/config") return "/config";
    if (e === "/debug" || e === "#debug") return "/debug";
    if (e === "/cancel") return "/cancel";
    if (e === "/clear" || e === "/reset") return "/clear";
    if (e === "/stats") return "/stats";
    if (e === "/task") return "/task";
    if (e === "/compact") return "/compact";
    if (e === "/model") return "/model";
    if (e === "/effort") return "/effort"
}
