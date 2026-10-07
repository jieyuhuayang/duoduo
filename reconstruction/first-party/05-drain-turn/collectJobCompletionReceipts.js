// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: collectJobCompletionReceipts  (minified: Qmt, daemon.pretty.js:72245)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.1 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.8.1 (medium): A finished job's completion receipt now arrives as context on the owner's next turn instead of waking a turn of its own.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function collectJobCompletionReceipts(e, t, n, r, i) {
    let o = new Map,
        s = [];
    for (let u of n) {
        if (!u.eventId) continue;
        let l = await loadDrainItemEventCached(e, u, r, i);
        if (!l) continue;
        let c = extractJobCompletionJobId(l);
        if (!c) continue;
        let d = {
                item: u,
                event: l,
                prompt: renderMailboxEventPrompt(l, t)
            },
            f = o.get(c);
        f ? f.push(d) : o.set(c, [d]), s.push(u.eventId)
    }
    if (o.size === 0) return null;
    let a = [];
    for (let [u, l] of o) a.push(l.length === 1 ? l[0].prompt : Xmt(e, t, u, l));
    return {
        text: a.join(`

`),
        eventIds: s
    }
}
