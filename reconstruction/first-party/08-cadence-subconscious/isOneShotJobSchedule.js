// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: isOneShotJobSchedule  (minified: r$, daemon.pretty.js:61004)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isOneShotJobSchedule(e) {
    return e === "once" || e.startsWith("@in ") || e === "keepalive"
}
