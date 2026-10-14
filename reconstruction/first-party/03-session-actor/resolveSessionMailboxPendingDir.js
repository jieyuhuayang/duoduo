// duoduo reconstruction — subsystem: 03-session-actor
// symbol: resolveSessionMailboxPendingDir  (minified: Gd, daemon.pretty.js:32392)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.3.1 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 2 renamed — 0 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.3.1 (medium): Cross-cutting runtime I/O optimizations — caching, append-only mailbox, sharded registry, and lazy reads across hot paths.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveSessionMailboxPendingDir(paths, sessionKey) {
    return Gr.join(resolveSessionDir(paths, sessionKey), "mailbox", "pending")
}
