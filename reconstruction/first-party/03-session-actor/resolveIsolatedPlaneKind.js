// duoduo reconstruction — subsystem: 03-session-actor
// symbol: resolveIsolatedPlaneKind  (minified: O0e, daemon.pretty.js:89537)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveIsolatedPlaneKind(e) {
    let t = classifySessionKeyKind(e);
    return t === "channel" || t === "job" ? null : t
}
