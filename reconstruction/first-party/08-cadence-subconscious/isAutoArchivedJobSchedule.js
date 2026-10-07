// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: isAutoArchivedJobSchedule  (minified: uRe, daemon.pretty.js:80537)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.4.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.4.0 (medium): fix(job): wire system-level notify delivery and fix child job routing (9e7b13b)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isAutoArchivedJobSchedule(e) {
    return e === "once" || e.startsWith("@in ")
}
