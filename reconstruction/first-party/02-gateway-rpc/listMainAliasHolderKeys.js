// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: listMainAliasHolderKeys  (minified: Uft, daemon.pretty.js:90198)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.7 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.8.7 (medium): **Main session.** One channel session holds the alias `main`; Notify takes `main` as an explicit target and resolves it at each delivery.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function listMainAliasHolderKeys(e) {
    return e.state === "held" ? [e.session_key] : e.state === "ambiguous" ? e.candidates : []
}
