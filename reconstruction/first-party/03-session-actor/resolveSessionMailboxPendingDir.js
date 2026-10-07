// duoduo reconstruction — subsystem: 03-session-actor
// symbol: resolveSessionMailboxPendingDir  (minified: Zd, daemon.pretty.js:32392)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveSessionMailboxPendingDir(e, t) {
    return Gr.join(resolveSessionDir(e, t), "mailbox", "pending")
}
