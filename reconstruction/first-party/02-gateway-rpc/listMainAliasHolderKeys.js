// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: listMainAliasHolderKeys  (minified: Uft, daemon.pretty.js:90198)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.7 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function listMainAliasHolderKeys(e) {
    return e.state === "held" ? [e.session_key] : e.state === "ambiguous" ? e.candidates : []
}
