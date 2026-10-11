// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: appendPiConfigIssues  (minified: Ive, daemon.pretty.js:65874)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// locals: 2 renamed — 0 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function appendPiConfigIssues(existing, additional) {
    return !additional || additional.length === 0 ? existing : [...existing ?? [], ...additional]
}
