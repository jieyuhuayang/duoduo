// duoduo reconstruction — subsystem: 03-session-actor
// symbol: listMailboxPendingItems  (minified: lb, daemon.pretty.js:32617)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function listMailboxPendingItems(e, t) {
    let n = Ld(e, t),
        r;
    try {
        r = (await yr.readdir(n)).filter(o => o.endsWith(".item.json")).sort()
    } catch {
        return []
    }
    let i = [];
    for (let o of r) try {
        let s = await yr.readFile(Ys.join(n, o), "utf8"),
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
