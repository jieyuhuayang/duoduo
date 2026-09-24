// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: normalizeIncludePathKey  (minified: qEe, daemon.pretty.js:82254)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function normalizeIncludePathKey(e) {
    let t = ha.resolve(e);
    return process.platform === "win32" ? t.toLowerCase() : t
}
