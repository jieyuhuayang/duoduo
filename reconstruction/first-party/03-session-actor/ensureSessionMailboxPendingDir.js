// duoduo reconstruction — subsystem: 03-session-actor
// symbol: ensureSessionMailboxPendingDir  (minified: bU, daemon.pretty.js:32647)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// changelog v0.3.1 (medium): Cross-cutting runtime I/O optimizations — caching, append-only mailbox, sharded registry, and lazy reads across hot paths.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function ensureSessionMailboxPendingDir(e, t) {
    return await lYe(e, t), resolveSessionMailboxPendingDir(e, t)
}
