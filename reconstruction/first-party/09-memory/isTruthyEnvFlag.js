// duoduo reconstruction — subsystem: 09-memory
// symbol: isTruthyEnvFlag  (minified: V6, daemon.pretty.js:68538)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isTruthyEnvFlag(e) {
    let t = process.env[e]?.trim().toLowerCase();
    return t === "1" || t === "true" || t === "yes" || t === "on"
}
