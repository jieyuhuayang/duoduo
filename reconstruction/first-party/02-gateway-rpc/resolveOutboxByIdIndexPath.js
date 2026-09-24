// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: resolveOutboxByIdIndexPath  (minified: nU, daemon.pretty.js:36142)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveOutboxByIdIndexPath(e) {
    return Mr.join(e.outboxDir, "index", "by_id.jsonl")
}
