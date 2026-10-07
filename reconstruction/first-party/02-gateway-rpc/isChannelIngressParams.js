// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: isChannelIngressParams  (minified: yR, daemon.pretty.js:31677)
// name: INFERRED — upstream's own spelling, confirmed against the published source @openduo/protocol@0.8.4 channel.ts (maps/published_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isChannelIngressParams(e) {
    return !(!isRecord(e) || typeof e.session_key != "string" || !isOptionalString(e.display_name) || !isOptionalString(e.text) || !isOptionalString(e.idempotency_key) || !isOptionalString(e.cwd_abs) || !isAttachmentArray(e.attachments) || !isOptionalString(e.source_kind) || !isOptionalString(e.channel_id))
}
