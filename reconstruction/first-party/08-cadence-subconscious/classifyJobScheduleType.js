// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: classifyJobScheduleType  (minified: AS, daemon.pretty.js:80239)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function classifyJobScheduleType(e) {
    return isOneShotJobSchedule(e) ? "one-shot" : "periodic"
}
