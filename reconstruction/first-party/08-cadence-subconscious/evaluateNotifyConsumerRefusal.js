// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: evaluateNotifyConsumerRefusal  (minified: al, daemon.pretty.js:66041)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.2 — first release whose bundle holds this declaration; body changed in v0.8.7 (maps/history_daemon.json)
// locals: 8 renamed — 3 from the code at the binding (rule), 5 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.2 (medium): **Notify refuses a session nobody reads.** Delivering into a foreground session whose last consumer take is older than `ALADUO_NOTIFY_UNCONSUMED_HOURS` (default off until set) now fails
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function evaluateNotifyConsumerRefusal(paths, sessionKey, finalSubscriberCount) {
    if (classifySessionKeyKind(sessionKey) !== "channel") return {
        refused: !1
    };
    let consumerInputs = await fwe(paths, sessionKey);
    if (finalSubscriberCount(sessionKey) > 0) return {
        refused: !1,
        inputs: consumerInputs
    };
    let now = Date.now(),
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
        candidates: await listSessionsWithRecentConsumer(paths, sessionKey, finalSubscriberCount, now, notifyUnconsumedHours)
    }
}
