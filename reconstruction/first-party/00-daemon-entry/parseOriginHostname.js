// duoduo reconstruction — subsystem: 00-daemon-entry
// symbol: parseOriginHostname  (minified: BSt, daemon.pretty.js:93505)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// locals: 2 renamed — 1 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function parseOriginHostname(origin) {
    try {
        let hostname = new URL(origin).hostname;
        return hostname ? gK(hostname) : null
    } catch {
        return null
    }
}
