// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: resolveOutboxReplayFilePath  (minified: ws, daemon.pretty.js:36257)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveOutboxReplayFilePath(e, t) {
    return Lr.join(resolveOutboxReplayDir(e), `${oet(t)}.jsonl`)
}
