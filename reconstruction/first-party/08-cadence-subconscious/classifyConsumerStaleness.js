// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: classifyConsumerStaleness  (minified: Bwe, daemon.pretty.js:66826)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.2 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 6 renamed — 0 from the code at the binding (rule), 6 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.2 (medium): whose last consumer take is older than `ALADUO_NOTIFY_UNCONSUMED_HOURS`
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function classifyConsumerStaleness(inputs, unconsumedHours, now) {
    let referenceAt = inputs.last_cursor_advance_at ?? inputs.oldest_waiting_created_at,
        referenceMs = referenceAt === void 0 ? Number.NaN : Date.parse(referenceAt),
        ageMs = Number.isFinite(referenceMs) ? now - referenceMs : void 0;
    return unconsumedHours <= 0 ? {
        unconsumed: !1,
        age_ms: ageMs
    } : {
        unconsumed: inputs.records_past_cursor > 0 && ageMs !== void 0 && ageMs > unconsumedHours * xpt,
        age_ms: ageMs
    }
}
