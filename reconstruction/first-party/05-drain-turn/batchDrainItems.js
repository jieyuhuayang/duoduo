// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: batchDrainItems  (minified: KU, daemon.pretty.js:61066)
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
        u = () => a ? Number.POSITIVE_INFINITY : n.fallbackBatchSize;
    for (let c of t) {
        if (i.length >= u()) break;
        let l = await f8e(e, c, r, n.perf);
        if (i.length === 0) {
            a = l ? VU(l) : !1, i.push(c), s = l ? Mde(l.ts) : null, s === null && (o = !1);
            continue
        }
        if ((l ? VU(l) : !1) !== a) break;
        if (!o) {
            i.push(c);
            continue
        }
        let p = l ? Mde(l.ts) : null;
        if (s === null || p === null) {
            o = !1, i.push(c);
            continue
        }
        if (Math.abs(p - s) > n.mergeWindowMs) break;
        i.push(c), s = p
    }
    return {
        items: i,
        events: r
    }
}
