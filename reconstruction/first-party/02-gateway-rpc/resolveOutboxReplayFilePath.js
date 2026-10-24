// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: resolveOutboxReplayFilePath  (minified: Ss, daemon.pretty.js:38339)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// locals: 2 renamed — 0 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.3.0 (medium): **runtime**: Split outbox replay bootstrap read/write paths so live appends no longer rebuild replay artifacts on every write.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveOutboxReplayFilePath(paths, sessionKey) {
    return Fr.join(resolveOutboxReplayDir(paths), `${sit(sessionKey)}.jsonl`)
}
