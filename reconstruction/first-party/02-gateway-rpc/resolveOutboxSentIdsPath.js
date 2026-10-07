// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: resolveOutboxSentIdsPath  (minified: Cce, daemon.pretty.js:36183)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveOutboxSentIdsPath(e) {
    return Lr.join(e.outboxDir, ".sent_ids")
}
