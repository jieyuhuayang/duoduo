// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: isChannelCapabilities  (minified: A8e, daemon.pretty.js:31713)
// name: INFERRED — upstream's own spelling, confirmed against the published source @openduo/protocol@0.8.4 channel.ts (maps/published_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isChannelCapabilities(e) {
    if (e === void 0) return !0;
    if (!isRecord(e) || !isRecord(e.outbound)) return !1;
    let t = e.outbound;
    return !(!Array.isArray(t.accept_mime) || !t.accept_mime.every(n => typeof n == "string" && isMimePattern(n.trim())) || t.max_bytes !== void 0 && (typeof t.max_bytes != "number" || !Number.isInteger(t.max_bytes) || t.max_bytes <= 0) || t.accept_stream_end_reasons !== void 0 && (!Array.isArray(t.accept_stream_end_reasons) || !t.accept_stream_end_reasons.every(n => typeof n == "string")))
}
