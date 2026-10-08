// duoduo reconstruction — subsystem: 03-session-actor
// symbol: removeOrphanMailboxItemFiles  (minified: Nae, daemon.pretty.js:32771)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function removeOrphanMailboxItemFiles(e, t) {
    let n = resolveSessionMailboxPendingDir(e, t),
        r;
    try {
        r = await wr.readdir(n)
    } catch {
        return {
            removed: 0
        }
    }
    let i = 0;
    for (let o of r) {
        if (!o.endsWith(".item.json")) continue;
        let s = ea.join(n, o);
        try {
            let a = await wr.readFile(s, "utf8");
            JSON.parse(a).event_id || (await wr.unlink(s), i += 1)
        } catch {
            try {
                await wr.unlink(s), i += 1
            } catch {}
        }
    }
    return {
        removed: i
    }
}
