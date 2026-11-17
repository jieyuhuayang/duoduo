// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: resolveJobScheduleAnchor  (minified: e6, daemon.pretty.js:62856)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.9 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 1 renamed — 1 from the code at the binding (rule), 0 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveJobScheduleAnchor(e, t) {
    let lastScheduledAt = t.last_scheduled_at ?? t.last_run_at,
        r = t.last_scheduled_at ? new Date(t.last_scheduled_at).getTime() : Number.NaN,
        i = t.last_run_started_at ? new Date(t.last_run_started_at).getTime() : Number.NaN,
        o = !Number.isFinite(i) || Number.isFinite(r) && i < r;
    return isOneShotJobSchedule(e) && t.last_scheduled_at && o && (t.last_result === "unknown" || t.last_result === "failure") ? null : lastScheduledAt
}
