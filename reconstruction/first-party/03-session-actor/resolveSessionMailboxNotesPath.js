// duoduo reconstruction — subsystem: 03-session-actor
// symbol: resolveSessionMailboxNotesPath  (minified: Pb, daemon.pretty.js:32396)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.3.1 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.3.1 (medium): Cross-cutting runtime I/O optimizations — caching, append-only mailbox, sharded registry, and lazy reads across hot paths.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveSessionMailboxNotesPath(e, t) {
    return Gr.join(resolveSessionDir(e, t), "mailbox", "notes.jsonl")
}
