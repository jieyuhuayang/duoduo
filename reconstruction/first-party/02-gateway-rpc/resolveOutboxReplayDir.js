// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: resolveOutboxReplayDir  (minified: CI, daemon.pretty.js:37462)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.3.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 1 renamed — 0 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.3.0 (medium): **runtime**: Split outbox replay bootstrap read/write paths so live appends no longer rebuild replay artifacts on every write.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveOutboxReplayDir(paths) {
    return qr.join(paths.outboxDir, "replay")
}
