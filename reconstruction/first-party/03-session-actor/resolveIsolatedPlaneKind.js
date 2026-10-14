// duoduo reconstruction — subsystem: 03-session-actor
// symbol: resolveIsolatedPlaneKind  (minified: IIe, daemon.pretty.js:91019)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// locals: 2 renamed — 0 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.2 (medium): `duoduo session wake` refuses the kernel plane rather than accepting a target it cannot reach
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveIsolatedPlaneKind(sessionKey) {
    let kind = classifySessionKeyKind(sessionKey);
    return kind === "channel" || kind === "job" ? null : kind
}
