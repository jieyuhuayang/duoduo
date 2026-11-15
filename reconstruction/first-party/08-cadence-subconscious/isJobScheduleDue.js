// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: isJobScheduleDue  (minified: kve, daemon.pretty.js:62851)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.9 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 6 renamed — 0 from the code at the binding (rule), 6 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.6 (medium): The loop runs as a job, paces itself via `ScheduleWakeup`
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isJobScheduleDue(schedule, lastRunAt, now = new Date, createdAt, runAt) {
    let nextDue = computeJobNextDue(schedule, lastRunAt, now, createdAt, runAt);
    return nextDue.kind === "never" ? !1 : nextDue.kind === "now" ? !0 : now.getTime() >= nextDue.ms
}
