// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: isChannelIngressParams  (minified: AR, daemon.pretty.js:32874)
// name: INFERRED — upstream's own spelling, confirmed against the published source @openduo/protocol@0.8.4 channel.ts (maps/published_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.4.2 (maps/history_daemon.json)
// locals: 1 renamed — 0 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isChannelIngressParams(params) {
    return !(!isRecord(params) || typeof params.session_key != "string" || !isOptionalString(params.display_name) || !isOptionalString(params.text) || !isOptionalString(params.idempotency_key) || !isOptionalString(params.cwd_abs) || !isAttachmentArray(params.attachments) || !isOptionalString(params.source_kind) || !isOptionalString(params.channel_id))
}
