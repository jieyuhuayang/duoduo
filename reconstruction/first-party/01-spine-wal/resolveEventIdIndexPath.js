// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: resolveEventIdIndexPath  (minified: Rb, daemon.pretty.js:32134)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveEventIdIndexPath(e) {
    return FR.join(e.eventsIndexDir, "by_id.jsonl")
}
