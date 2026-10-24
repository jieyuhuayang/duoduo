// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: isOneShotJobSchedule  (minified: tO, daemon.pretty.js:63405)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.4.5 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 1 renamed — 0 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.4.5 (high): **Job `keepalive` schedule type** (#44): a new cron value that runs once then keeps its session dormant.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isOneShotJobSchedule(schedule) {
    return schedule === "once" || schedule.startsWith("@in ") || schedule === "keepalive"
}
