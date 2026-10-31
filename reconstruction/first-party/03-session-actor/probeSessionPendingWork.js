// duoduo reconstruction — subsystem: 03-session-actor
// symbol: probeSessionPendingWork  (minified: Wb, daemon.pretty.js:33627)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.6.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 5 renamed — 2 from the code at the binding (rule), 3 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.6.0 (high): Archiving now refuses unless the session is provably empty of pending work (checking every shape of in-flight work), ignores channel placeholder actors, and treats the archive marker as a real "about to disappear" signal.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function probeSessionPendingWork(paths, sessionKey) {
    let sessionDir = resolveSessionDir(paths, sessionKey);
    try {
        if ((await listPendingInboxFiles(ei.join(sessionDir, "inbox"))).length > 0) return "pending";
        try {
            if ((await Lo.readdir(ei.join(sessionDir, "mailbox", "pending"))).some(fileName => fileName.endsWith(".item.json"))) return "pending"
        } catch (err) {
            if (err.code !== "ENOENT") throw err
        }
    } catch {
        return "unreadable"
    }
    return "clear"
}
