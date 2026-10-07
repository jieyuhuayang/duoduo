// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: isChannelDescribeParams  (minified: SR, daemon.pretty.js:31701)
// name: INFERRED — upstream's own spelling, confirmed against the published source @openduo/protocol@0.8.4 channel.ts (maps/published_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isChannelDescribeParams(e) {
    return !(!isRecord(e) || typeof e.channel_kind != "string" || e.channel_kind.trim().length === 0 || typeof e.channel_id != "string" || e.channel_id.trim().length === 0 || !isOptionalString(e.session_key))
}
