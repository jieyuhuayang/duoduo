// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: validateJobScheduleExpression  (minified: cve, daemon.pretty.js:62597)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.6.1 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 1 renamed — 0 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.6.1 (high): `@in` and `@every` now accept composite durations such as `2h30m` and `1d6h4m`. Invalid cron strings, malformed durations, and delays outside the representable time range are rejected when the job is created.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function validateJobScheduleExpression(schedule) {
    if (schedule.length === 0) throw new Error("schedule must not be empty");
    if (!(schedule === "once" || schedule === "keepalive")) {
        if (schedule.startsWith("@in ")) {
            assertScheduleDurationRepresentable(parseScheduleDurationMs(schedule.substring(4).trim()), schedule);
            return
        }
        if (schedule.startsWith("@every ")) {
            assertScheduleDurationRepresentable(parseScheduleDurationMs(schedule.substring(7).trim()), schedule);
            return
        }
        Xw.CronExpressionParser.parse(schedule, {
            tz: "UTC"
        })
    }
}
