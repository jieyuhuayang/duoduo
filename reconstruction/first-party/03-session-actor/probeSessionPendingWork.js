// duoduo reconstruction — subsystem: 03-session-actor
// symbol: probeSessionPendingWork  (minified: Cb, daemon.pretty.js:32429)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.6.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.6.0 (high): Archiving now refuses unless the session is provably empty of pending work (checking every shape of in-flight work), ignores channel placeholder actors, and treats the archive marker as a real "about to disappear" signal.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function probeSessionPendingWork(e, t) {
    let n = resolveSessionDir(e, t);
    try {
        if ((await listPendingInboxFiles(Gr.join(n, "inbox"))).length > 0) return "pending";
        try {
            if ((await No.readdir(Gr.join(n, "mailbox", "pending"))).some(i => i.endsWith(".item.json"))) return "pending"
        } catch (r) {
            if (r.code !== "ENOENT") throw r
        }
    } catch {
        return "unreadable"
    }
    return "clear"
}
