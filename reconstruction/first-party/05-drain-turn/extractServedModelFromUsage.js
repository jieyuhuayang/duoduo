// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: extractServedModelFromUsage  (minified: Rxe, daemon.pretty.js:70567)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.1 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.8.1 (medium): The dashboard and the usage ledger record the model that actually served each turn, not the one that was requested
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function extractServedModelFromUsage(e) {
    let t = e?.model?.trim();
    if (!(!t || t === "default")) return t
}
