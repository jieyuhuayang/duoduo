// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: isChannelFileUploadParams  (minified: _R, daemon.pretty.js:31681)
// name: INFERRED — upstream's own spelling, confirmed against the published source @openduo/protocol@0.8.4 channel.ts (maps/published_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isChannelFileUploadParams(e) {
    return !(!isRecord(e) || typeof e.session_key != "string" || typeof e.name != "string" || typeof e.mime != "string" || typeof e.content_base64 != "string")
}
