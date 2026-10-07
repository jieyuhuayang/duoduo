// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: isChannelFileDownloadParams  (minified: bR, daemon.pretty.js:31685)
// name: INFERRED — upstream's own spelling, confirmed against the published source @openduo/protocol@0.8.4 channel.ts (maps/published_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isChannelFileDownloadParams(e) {
    return !(!isRecord(e) || typeof e.path != "string")
}
