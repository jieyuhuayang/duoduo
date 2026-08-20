// duoduo reconstruction — subsystem: 09-memory
// symbol: routeContractDecision  (minified: u2, daemon.pretty.js:58100)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function routeContractDecision(e) {
    return e.rel.startsWith("topics/") && (e.slug.startsWith("lesson-") || e.slug.startsWith("groove-")) ? "pattern-tracker" : "memory-weaver"
}
