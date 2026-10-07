// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: isChannelAckParams  (minified: wR, daemon.pretty.js:31697)
// name: INFERRED — upstream's own spelling, confirmed against the published source @openduo/protocol@0.8.4 channel.ts (maps/published_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isChannelAckParams(e) {
    return !(!isRecord(e) || typeof e.session_key != "string" || typeof e.consumer_id != "string" || e.consumer_id.trim().length === 0 || typeof e.cursor != "string" || e.cursor.trim().length === 0)
}
