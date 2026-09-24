// duoduo reconstruction — subsystem: 03-session-actor
// symbol: deleteMailboxPendingItemsByEventIds  (minified: Ao, daemon.pretty.js:32639)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function deleteMailboxPendingItemsByEventIds(e, t, n) {
    if (n.length === 0) return;
    let r = resolveSessionMailboxPendingDir(e, t),
        i;
    try {
        i = await yr.readdir(r)
    } catch {
        return
    }
    let o = new Set(n),
        s = o.size;
    for (let a of i) {
        if (s === 0) break;
        if (!a.endsWith(".item.json")) continue;
        let u;
        try {
            let l = await yr.readFile(Ys.join(r, a), "utf8");
            u = JSON.parse(l).event_id ?? void 0
        } catch {
            continue
        }
        if (u !== void 0 && o.has(u)) {
            try {
                await yr.unlink(Ys.join(r, a))
            } catch {}
            s -= 1
        }
    }
}
