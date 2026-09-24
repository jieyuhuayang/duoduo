// duoduo reconstruction — subsystem: 03-session-actor
// symbol: stringifyExecutionToolInput  (minified: mEe, daemon.pretty.js:80186)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function stringifyExecutionToolInput(e) {
    if (e == null) return "{}";
    if (typeof e == "string") return e;
    try {
        return JSON.stringify(e) ?? "{}"
    } catch {
        return "{}"
    }
}
