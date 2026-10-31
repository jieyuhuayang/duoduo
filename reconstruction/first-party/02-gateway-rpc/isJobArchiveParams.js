// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: isJobArchiveParams  (minified: BR, daemon.pretty.js:32943)
// name: INFERRED — upstream's own spelling, confirmed against the published source @openduo/protocol@0.8.4 job.ts (maps/published_daemon.json)
// locals: 1 renamed — 0 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isJobArchiveParams(params) {
    return !(!isRecord(params) || typeof params.id != "string")
}
