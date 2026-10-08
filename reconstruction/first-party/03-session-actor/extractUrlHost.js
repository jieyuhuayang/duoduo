// duoduo reconstruction — subsystem: 03-session-actor
// symbol: extractUrlHost  (minified: exe, daemon.pretty.js:69944)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function extractUrlHost(e) {
    if (e) try {
        return new URL(e).host || e
    } catch {
        return e
    }
}
