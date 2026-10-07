// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: parseGatewayCommandText  (minified: tv, daemon.pretty.js:87480)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function parseGatewayCommandText(e) {
    if (!e) return;
    let t = e.trim();
    if (!t) return;
    let n = pde(t);
    if (!n) return;
    let r = canonicalizeGatewayCommand(n);
    if (!r) return;
    let i = t.slice(n.length).trim();
    return {
        raw: t,
        name: r,
        args: i
    }
}
