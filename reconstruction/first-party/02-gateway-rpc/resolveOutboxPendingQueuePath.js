// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: resolveOutboxPendingQueuePath  (minified: ic, daemon.pretty.js:36581)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveOutboxPendingQueuePath(e) {
    return Lr.join(e.outboxDir, ".pending_queue.jsonl")
}
