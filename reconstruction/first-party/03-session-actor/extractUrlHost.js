// duoduo reconstruction — subsystem: 03-session-actor
// symbol: extractUrlHost  (minified: rxe, daemon.pretty.js:69945)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// locals: 1 renamed — 0 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function extractUrlHost(url) {
    if (url) try {
        return new URL(url).host || url
    } catch {
        return url
    }
}
