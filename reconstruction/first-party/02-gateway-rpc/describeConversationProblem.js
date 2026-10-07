// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: describeConversationProblem  (minified: cae, daemon.pretty.js:31624)
// name: INFERRED — upstream's own spelling, confirmed against the published source @openduo/protocol@0.8.4 system.ts (maps/published_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function describeConversationProblem(e, t) {
    return /[\s:]/.test(t) ? `${e} "${t}" has a space or ':'` : null
}
