// duoduo reconstruction — subsystem: 03-session-actor
// symbol: appendSessionMailboxNote  (minified: Zb, daemon.pretty.js:33996)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.3.1 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 6 renamed — 1 from the code at the binding (rule), 5 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.3.1 (medium): Cross-cutting runtime I/O optimizations — caching, append-only mailbox, sharded registry, and lazy reads across hot paths.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function appendSessionMailboxNote(paths, sessionKey, note, now = new Date) {
    await ensureSessionMailboxPendingDir(paths, sessionKey);
    let sessionMailboxNotesPath = resolveSessionMailboxNotesPath(paths, sessionKey),
        record = {
            ts: now.toISOString(),
            note: note.trim()
        };
    await xr.appendFile(sessionMailboxNotesPath, JSON.stringify(record) + `
`)
}
