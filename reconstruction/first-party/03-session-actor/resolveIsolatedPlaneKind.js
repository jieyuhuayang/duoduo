// duoduo reconstruction — subsystem: 03-session-actor
// symbol: resolveIsolatedPlaneKind  (minified: xIe, daemon.pretty.js:90973)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// changelog v0.8.2 (medium): `duoduo session wake` refuses the kernel plane rather than accepting a target it cannot reach
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveIsolatedPlaneKind(e) {
    let t = classifySessionKeyKind(e);
    return t === "channel" || t === "job" ? null : t
}
