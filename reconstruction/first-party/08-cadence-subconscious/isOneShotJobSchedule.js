// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: isOneShotJobSchedule  (minified: FC, daemon.pretty.js:61323)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.4.5 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.4.5 (high): **Job `keepalive` schedule type** (#44): a new cron value that runs once then keeps its session dormant.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isOneShotJobSchedule(e) {
    return e === "once" || e.startsWith("@in ") || e === "keepalive"
}
