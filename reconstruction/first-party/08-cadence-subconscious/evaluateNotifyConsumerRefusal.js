// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: evaluateNotifyConsumerRefusal  (minified: P$, daemon.pretty.js:64867)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function evaluateNotifyConsumerRefusal(e, t) {
    if (lr(t) !== "channel") return {
        refused: !1
    };
    let n = await O_e(e, t),
        r = Date.now(),
        i = resolveNotifyUnconsumedHours(),
        o = classifyConsumerStaleness(n, i, r),
        s = o.age_ms;
    return !o.unconsumed || s === void 0 ? {
        refused: !1,
        inputs: n
    } : {
        refused: !0,
        inputs: n,
        verdict: {
            ...o,
            age_ms: s
        },
        unconsumedHours: i,
        candidates: await listSessionsWithRecentConsumer(e, t, r, i)
    }
}
