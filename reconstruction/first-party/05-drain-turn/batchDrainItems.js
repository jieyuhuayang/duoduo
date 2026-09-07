// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: batchDrainItems  (minified: fB, daemon.pretty.js:65194)
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
        a = "regular",
        l = () => uit(a) ? Number.POSITIVE_INFINITY : n.fallbackBatchSize;
    for (let u of t) {
        if (i.length >= l()) break;
        let c = await sit(e, u, r, n.perf);
        if (i.length === 0) {
            a = Fye(c), cit(a) && (s = !1), i.push(u), o = c ? Lye(c.ts) : null, o === null && (s = !1);
            continue
        }
        let d = Fye(c);
        if (d !== a) {
            if (YP(a) && YP(d)) continue;
            break
        }
        if (!s) {
            i.push(u);
            continue
        }
        let p = c ? Lye(c.ts) : null;
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
