// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: describeConversationProblem  (minified: dae, daemon.pretty.js:31624)
// name: INFERRED — upstream's own spelling, confirmed against the published source @openduo/protocol@0.8.4 system.ts (maps/published_daemon.json)
// locals: 2 renamed — 0 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function describeConversationProblem(label, value) {
    return /[\s:]/.test(value) ? `${label} "${value}" has a space or ':'` : null
}
