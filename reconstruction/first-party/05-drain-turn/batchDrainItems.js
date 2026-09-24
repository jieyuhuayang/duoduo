// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: batchDrainItems  (minified: EH, daemon.pretty.js:71807)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
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
        a = bH,
        u = () => fft(a) ? Number.POSITIVE_INFINITY : n.fallbackBatchSize;
    for (let l of t) {
        if (i.length >= u()) break;
        let c = await tke(e, l, r, n.perf);
        if (c && extractJobCompletionJobId(c) !== null) continue;
        if (i.length === 0) {
            a = classifyDrainBatchClass(c), i.push(l), o = c ? parseEventTimestampMs(c.ts) : null, o === null && (s = !1);
            continue
        }
        if (classifyDrainBatchClass(c) !== a) break;
        if (!s) {
            i.push(l);
            continue
        }
        let f = c ? parseEventTimestampMs(c.ts) : null;
        if (o === null || f === null) {
            s = !1, i.push(l);
            continue
        }
        if (Math.abs(f - o) > n.mergeWindowMs) break;
        i.push(l), o = f
    }
    return {
        items: i,
        events: r
    }
}
