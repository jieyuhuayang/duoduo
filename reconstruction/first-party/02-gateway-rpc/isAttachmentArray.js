// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: isAttachmentArray  (minified: D8e, daemon.pretty.js:31709)
// name: INFERRED — upstream's own spelling, confirmed against the published source @openduo/protocol@0.8.4 channel.ts (maps/published_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 2 renamed — 0 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isAttachmentArray(attachments) {
    return attachments === void 0 ? !0 : Array.isArray(attachments) ? attachments.every(attachment => isRecord(attachment) ? typeof attachment.path == "string" && typeof attachment.mime == "string" : !1) : !1
}
