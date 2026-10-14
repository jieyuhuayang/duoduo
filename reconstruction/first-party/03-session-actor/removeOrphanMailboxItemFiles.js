// duoduo reconstruction — subsystem: 03-session-actor
// symbol: removeOrphanMailboxItemFiles  (minified: Dae, daemon.pretty.js:32771)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.4.2 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 8 renamed — 2 from the code at the binding (rule), 6 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function removeOrphanMailboxItemFiles(paths, sessionKey) {
    let sessionMailboxPendingDir = resolveSessionMailboxPendingDir(paths, sessionKey),
        entries;
    try {
        entries = await wr.readdir(sessionMailboxPendingDir)
    } catch {
        return {
            removed: 0
        }
    }
    let removed = 0;
    for (let fileName of entries) {
        if (!fileName.endsWith(".item.json")) continue;
        let filePath = ea.join(sessionMailboxPendingDir, fileName);
        try {
            let content = await wr.readFile(filePath, "utf8");
            JSON.parse(content).event_id || (await wr.unlink(filePath), removed += 1)
        } catch {
            try {
                await wr.unlink(filePath), removed += 1
            } catch {}
        }
    }
    return {
        removed
    }
}
