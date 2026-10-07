// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: evaluateNotifyConsumerRefusal  (minified: Ng, daemon.pretty.js:64770)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.2 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.8.2 (medium): **Notify refuses a session nobody reads.** Delivering into a foreground session whose last consumer take is older than `ALADUO_NOTIFY_UNCONSUMED_HOURS` (default off until set) now fails
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function evaluateNotifyConsumerRefusal(e, t) {
    if (classifySessionKeyKind(t) !== "channel") return {
        refused: !1
    };
    let n = await Jbe(e, t),
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
