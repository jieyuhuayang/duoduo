// duoduo reconstruction — subsystem: 03-session-actor
// symbol: resolveSessionMailboxNotesPath  (minified: ib, daemon.pretty.js:32293)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveSessionMailboxNotesPath(e, t) {
    return Hr.join(resolveSessionDir(e, t), "mailbox", "notes.jsonl")
}
