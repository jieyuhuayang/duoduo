// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: hashDeliveryCursorKey  (minified: Ldt, daemon.pretty.js:65686)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function hashDeliveryCursorKey(e) {
    return Mdt.createHash("sha256").update(e).digest("hex")
}
