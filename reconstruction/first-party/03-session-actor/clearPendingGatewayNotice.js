// duoduo reconstruction — subsystem: 03-session-actor
// symbol: clearPendingGatewayNotice  (minified: Umt, daemon.pretty.js:72078)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function clearPendingGatewayNotice(e, t) {
    await clearSessionRuntimeStateField(e, t, "pending_gateway_notice")
}
