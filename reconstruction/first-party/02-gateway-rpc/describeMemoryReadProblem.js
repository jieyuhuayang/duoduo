// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: describeMemoryReadProblem  (minified: nU, daemon.pretty.js:31628)
// name: INFERRED — upstream's own spelling, confirmed against the published source @openduo/protocol@0.8.4 system.ts (maps/published_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function describeMemoryReadProblem(e) {
    return isRecord(e) ? unknownKeyProblem(e, ["path"]) ?? textKeysProblem(e, ["path"], []) : "params must be one JSON object"
}
