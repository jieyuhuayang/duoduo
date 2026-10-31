// duoduo reconstruction — subsystem: 03-session-actor
// symbol: listMailboxPendingItems  (minified: Kb, daemon.pretty.js:33918)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.3.1 — first release whose bundle holds this declaration; body changed in v0.8.0 (maps/history_daemon.json)
// locals: 9 renamed — 3 from the code at the binding (rule), 6 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.3.1 (medium): Cross-cutting runtime I/O optimizations — caching, append-only mailbox, sharded registry, and lazy reads across hot paths.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function listMailboxPendingItems(paths, sessionKey) {
    let sessionMailboxPendingDir = resolveSessionMailboxPendingDir(paths, sessionKey),
        itemFiles;
    try {
        itemFiles = (await xr.readdir(sessionMailboxPendingDir)).filter(fileName => fileName.endsWith(".item.json")).sort()
    } catch {
        return []
    }
    let items = [];
    for (let fileName of itemFiles) try {
        let content = await xr.readFile(sa.join(sessionMailboxPendingDir, fileName), "utf8"),
            parsed = JSON.parse(content);
        items.push({
            line: parsed.line,
            eventId: parsed.event_id ?? void 0,
            replySessionKey: parsed.reply_session_key ?? void 0,
            createdAt: parsed.created_at ?? void 0,
            file: fileName
        })
    } catch {}
    return items
}
