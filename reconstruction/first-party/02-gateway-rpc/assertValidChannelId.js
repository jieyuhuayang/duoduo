// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: assertValidChannelId  (minified: ah, daemon.pretty.js:35809)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function assertValidChannelId(e) {
    if (!isValidChannelId(e)) throw new Error(`Invalid channel_id: "${e}". Must match [A-Za-z0-9_-]{1,128}.`)
}
