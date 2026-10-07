// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: isChannelCommandParams  (minified: vR, daemon.pretty.js:31693)
// name: INFERRED — upstream's own spelling, confirmed against the published source @openduo/protocol@0.8.4 channel.ts (maps/published_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isChannelCommandParams(e) {
    return !(!isRecord(e) || typeof e.session_key != "string" || typeof e.command != "string" || !isOptionalString(e.idempotency_key) || !isOptionalString(e.cwd_abs) || !isOptionalString(e.source_kind) || !isOptionalString(e.channel_id))
}
