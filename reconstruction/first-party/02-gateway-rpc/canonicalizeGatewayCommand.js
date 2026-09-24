// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: canonicalizeGatewayCommand  (minified: Jle, daemon.pretty.js:87088)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
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
