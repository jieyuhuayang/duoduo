// duoduo reconstruction — subsystem: 03-session-actor
// symbol: hashSessionKey  (minified: Do, daemon.pretty.js:32360)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function hashSessionKey(e) {
    return tYe.createHash("sha256").update(e).digest("hex")
}
