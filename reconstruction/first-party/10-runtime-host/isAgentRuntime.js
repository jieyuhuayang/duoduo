// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: isAgentRuntime  (minified: gR, daemon.pretty.js:31669)
// name: INFERRED — upstream's own spelling, confirmed against the published source @openduo/protocol@0.8.4 channel.ts (maps/published_daemon.json)
// locals: 1 renamed — 0 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.4 (medium): From v0.8.4 the value is refused with a sentence that names it and lists the valid ones.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isAgentRuntime(value) {
    return typeof value == "string" && mR.includes(value)
}
