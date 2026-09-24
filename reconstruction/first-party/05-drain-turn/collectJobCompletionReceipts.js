// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: collectJobCompletionReceipts  (minified: gft, daemon.pretty.js:71943)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function collectJobCompletionReceipts(e, t, n, r, i) {
    let o = new Map,
        s = [];
    for (let u of n) {
        if (!u.eventId) continue;
        let l = await tke(e, u, r, i);
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
    for (let [u, l] of o) a.push(l.length === 1 ? l[0].prompt : hft(e, t, u, l));
    return {
        text: a.join(`

`),
        eventIds: s
    }
}
