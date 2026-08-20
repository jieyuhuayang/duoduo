// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: batchDrainItems  (minified: r4, daemon.pretty.js:63798)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function batchDrainItems(e, t, n) {
    if (t.length === 0) return {
        items: [],
        events: new Map
    };
    let r = new Map,
        i = [],
        o = null,
        s = !0,
        a = !1,
        l = () => a ? Number.POSITIVE_INFINITY : n.fallbackBatchSize;
    for (let u of t) {
        if (i.length >= l()) break;
        let c = await Pet(e, u, r, n.perf);
        if (i.length === 0) {
            a = c ? Y2(c) : !1, i.push(u), o = c ? The(c.ts) : null, o === null && (s = !1);
            continue
        }
        if ((c ? Y2(c) : !1) !== a) break;
        if (!s) {
            i.push(u);
            continue
        }
        let p = c ? The(c.ts) : null;
        if (o === null || p === null) {
            s = !1, i.push(u);
            continue
        }
        if (Math.abs(p - o) > n.mergeWindowMs) break;
        i.push(u), o = p
    }
    return {
        items: i,
        events: r
    }
}
