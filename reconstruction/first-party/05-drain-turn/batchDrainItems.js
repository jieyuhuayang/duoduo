// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: batchDrainItems  (minified: eq, daemon.pretty.js:61189)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function batchDrainItems(e, t, n) {
    if (t.length === 0) return {
        items: [],
        events: new Map
    };
    let r = new Map,
        i = [],
        s = null,
        o = !0,
        a = !1,
        c = () => a ? Number.POSITIVE_INFINITY : n.fallbackBatchSize;
    for (let u of t) {
        if (i.length >= c()) break;
        let l = await T8e(e, u, r, n.perf);
        if (i.length === 0) {
            a = l ? GU(l) : !1, i.push(u), s = l ? Wde(l.ts) : null, s === null && (o = !1);
            continue
        }
        if ((l ? GU(l) : !1) !== a) break;
        if (!o) {
            i.push(u);
            continue
        }
        let p = l ? Wde(l.ts) : null;
        if (s === null || p === null) {
            o = !1, i.push(u);
            continue
        }
        if (Math.abs(p - s) > n.mergeWindowMs) break;
        i.push(u), s = p
    }
    return {
        items: i,
        events: r
    }
}
