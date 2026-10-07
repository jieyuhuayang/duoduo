// duoduo reconstruction — subsystem: 03-session-actor
// symbol: probeSessionPendingWork  (minified: Cb, daemon.pretty.js:32429)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
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
