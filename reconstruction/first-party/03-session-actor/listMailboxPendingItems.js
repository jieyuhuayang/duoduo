// duoduo reconstruction — subsystem: 03-session-actor
// symbol: listMailboxPendingItems  (minified: Nb, daemon.pretty.js:32720)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.3.1 — first release whose bundle holds this declaration; body changed in v0.8.0 (maps/history_daemon.json)
// changelog v0.3.1 (medium): Cross-cutting runtime I/O optimizations — caching, append-only mailbox, sharded registry, and lazy reads across hot paths.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function listMailboxPendingItems(e, t) {
    let n = resolveSessionMailboxPendingDir(e, t),
        r;
    try {
        r = (await wr.readdir(n)).filter(o => o.endsWith(".item.json")).sort()
    } catch {
        return []
    }
    let i = [];
    for (let o of r) try {
        let s = await wr.readFile(ea.join(n, o), "utf8"),
            a = JSON.parse(s);
        i.push({
            line: a.line,
            eventId: a.event_id ?? void 0,
            replySessionKey: a.reply_session_key ?? void 0,
            createdAt: a.created_at ?? void 0,
            file: o
        })
    } catch {}
    return i
}
