// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: stringifyPartitionToolInput  (minified: Lgt, daemon.pretty.js:85702)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function stringifyPartitionToolInput(e) {
    if (e == null) return "{}";
    if (typeof e == "string") return e;
    try {
        return JSON.stringify(e) ?? "{}"
    } catch {
        return "{}"
    }
}
