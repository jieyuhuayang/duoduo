// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: isChannelCapabilities  (minified: G7e, daemon.pretty.js:32910)
// name: INFERRED — upstream's own spelling, confirmed against the published source @openduo/protocol@0.8.4 channel.ts (maps/published_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.5.6 (maps/history_daemon.json)
// locals: 4 renamed — 1 from the code at the binding (rule), 3 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isChannelCapabilities(capabilities) {
    if (capabilities === void 0) return !0;
    if (!isRecord(capabilities) || !isRecord(capabilities.outbound)) return !1;
    let outbound = capabilities.outbound;
    return !(!Array.isArray(outbound.accept_mime) || !outbound.accept_mime.every(mimePattern => typeof mimePattern == "string" && isMimePattern(mimePattern.trim())) || outbound.max_bytes !== void 0 && (typeof outbound.max_bytes != "number" || !Number.isInteger(outbound.max_bytes) || outbound.max_bytes <= 0) || outbound.accept_stream_end_reasons !== void 0 && (!Array.isArray(outbound.accept_stream_end_reasons) || !outbound.accept_stream_end_reasons.every(reason => typeof reason == "string")))
}
