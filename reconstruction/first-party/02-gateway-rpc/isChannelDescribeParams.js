// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: isChannelDescribeParams  (minified: SR, daemon.pretty.js:31701)
// name: INFERRED — upstream's own spelling, confirmed against the published source @openduo/protocol@0.8.4 channel.ts (maps/published_daemon.json)
// since: v0.5.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.5.0 (high): new `channel.describe` / `channel.spawn` RPCs expose the instance lifecycle to channel plugins.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isChannelDescribeParams(e) {
    return !(!isRecord(e) || typeof e.channel_kind != "string" || e.channel_kind.trim().length === 0 || typeof e.channel_id != "string" || e.channel_id.trim().length === 0 || !isOptionalString(e.session_key))
}
