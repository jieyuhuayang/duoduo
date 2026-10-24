// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: describeMemoryReadProblem  (minified: MU, daemon.pretty.js:33710)
// name: INFERRED — upstream's own spelling, confirmed against the published source @openduo/protocol@0.8.4 system.ts (maps/published_daemon.json)
// locals: 1 renamed — 0 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function describeMemoryReadProblem(params) {
    return isRecord(params) ? unknownKeyProblem(params, ["path"]) ?? textKeysProblem(params, ["path"], []) : "params must be one JSON object"
}
