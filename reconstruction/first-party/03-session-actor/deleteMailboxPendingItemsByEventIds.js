// duoduo reconstruction — subsystem: 03-session-actor
// symbol: deleteMailboxPendingItemsByEventIds  (minified: Lo, daemon.pretty.js:34824)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.3.1 — first release whose bundle holds this declaration; body changed in v0.5.4 (maps/history_daemon.json)
// locals: 10 renamed — 3 from the code at the binding (rule), 7 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.3.1 (medium): Cross-cutting runtime I/O optimizations — caching, append-only mailbox, sharded registry, and lazy reads across hot paths.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function deleteMailboxPendingItemsByEventIds(paths, sessionKey, eventIds) {
    if (eventIds.length === 0) return;
    let sessionMailboxPendingDir = resolveSessionMailboxPendingDir(paths, sessionKey),
        entries;
    try {
        entries = await Sr.readdir(sessionMailboxPendingDir)
    } catch {
        return
    }
    let remainingIds = new Set(eventIds),
        size = remainingIds.size;
    for (let fileName of entries) {
        if (size === 0) break;
        if (!fileName.endsWith(".item.json")) continue;
        let eventId;
        try {
            let content = await Sr.readFile(ta.join(sessionMailboxPendingDir, fileName), "utf8");
            eventId = JSON.parse(content).event_id ?? void 0
        } catch {
            continue
        }
        if (eventId !== void 0 && remainingIds.has(eventId)) {
            try {
                await Sr.unlink(ta.join(sessionMailboxPendingDir, fileName))
            } catch {}
            size -= 1
        }
    }
}
