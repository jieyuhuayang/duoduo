// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: isSpineActivityParams  (minified: QR, daemon.pretty.js:33085)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.9 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isSpineActivityParams(e) {
    return isRecord(e) ? e.window === "15m" || e.window === "1h" : !1
}
