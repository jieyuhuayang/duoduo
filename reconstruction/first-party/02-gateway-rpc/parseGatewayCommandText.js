// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: parseGatewayCommandText  (minified: tv, daemon.pretty.js:87480)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 5 renamed — 2 from the code at the binding (rule), 3 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function parseGatewayCommandText(text) {
    if (!text) return;
    let trimmed = text.trim();
    if (!trimmed) return;
    let commandToken = pde(trimmed);
    if (!commandToken) return;
    let name = canonicalizeGatewayCommand(commandToken);
    if (!name) return;
    let trimmed2 = trimmed.slice(commandToken.length).trim();
    return {
        raw: trimmed,
        name,
        args: trimmed2
    }
}
