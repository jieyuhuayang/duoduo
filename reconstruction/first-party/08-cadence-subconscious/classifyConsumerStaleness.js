// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: classifyConsumerStaleness  (minified: O_e, daemon.pretty.js:64843)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function classifyConsumerStaleness(e, t, n) {
    let r = e.last_cursor_advance_at ?? e.oldest_waiting_created_at,
        i = r === void 0 ? Number.NaN : Date.parse(r),
        o = Number.isFinite(i) ? n - i : void 0;
    return t <= 0 ? {
        unconsumed: !1,
        age_ms: o
    } : {
        unconsumed: e.records_past_cursor > 0 && o !== void 0 && o > t * Lat,
        age_ms: o
    }
}
