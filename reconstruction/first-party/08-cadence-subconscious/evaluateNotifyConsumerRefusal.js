// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: evaluateNotifyConsumerRefusal  (minified: Ng, daemon.pretty.js:64770)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.2 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 7 renamed — 3 from the code at the binding (rule), 4 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.2 (medium): **Notify refuses a session nobody reads.** Delivering into a foreground session whose last consumer take is older than `ALADUO_NOTIFY_UNCONSUMED_HOURS` (default off until set) now fails
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function evaluateNotifyConsumerRefusal(paths, sessionKey) {
    if (classifySessionKeyKind(sessionKey) !== "channel") return {
        refused: !1
    };
    let consumerInputs = await Jbe(paths, sessionKey),
        now = Date.now(),
        notifyUnconsumedHours = resolveNotifyUnconsumedHours(),
        verdict = classifyConsumerStaleness(consumerInputs, notifyUnconsumedHours, now),
        ageMs = verdict.age_ms;
    return !verdict.unconsumed || ageMs === void 0 ? {
        refused: !1,
        inputs: consumerInputs
    } : {
        refused: !0,
        inputs: consumerInputs,
        verdict: {
            ...verdict,
            age_ms: ageMs
        },
        unconsumedHours: notifyUnconsumedHours,
        candidates: await listSessionsWithRecentConsumer(paths, sessionKey, now, notifyUnconsumedHours)
    }
}
