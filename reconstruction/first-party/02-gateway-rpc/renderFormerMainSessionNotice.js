// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: renderFormerMainSessionNotice  (minified: Vft, daemon.pretty.js:90227)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.7 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderFormerMainSessionNotice(e) {
    return [`Session ${e} is now the main session; this session no longer is.`, "Deliveries without a better target go there from now on.", `If you carry work the main session should own (open requests, commitments, jobs), hand it over to ${e} with Notify.`, "If the people here relied on this session being main, say so here in your own words."].join(`
`)
}
