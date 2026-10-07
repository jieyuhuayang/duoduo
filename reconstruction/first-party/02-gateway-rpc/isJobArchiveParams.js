// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: isJobArchiveParams  (minified: IR, daemon.pretty.js:31746)
// name: INFERRED — upstream's own spelling, confirmed against the published source @openduo/protocol@0.8.4 job.ts (maps/published_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isJobArchiveParams(e) {
    return !(!isRecord(e) || typeof e.id != "string")
}
