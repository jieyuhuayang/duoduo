// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: validateJobScheduleExpression  (minified: J_e, daemon.pretty.js:61327)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.6.1 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.6.1 (high): `@in` and `@every` now accept composite durations such as `2h30m` and `1d6h4m`. Invalid cron strings, malformed durations, and delays outside the representable time range are rejected when the job is created.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function validateJobScheduleExpression(e) {
    if (e.length === 0) throw new Error("schedule must not be empty");
    if (!(e === "once" || e === "keepalive")) {
        if (e.startsWith("@in ")) {
            assertScheduleDurationRepresentable(parseScheduleDurationMs(e.substring(4).trim()), e);
            return
        }
        if (e.startsWith("@every ")) {
            assertScheduleDurationRepresentable(parseScheduleDurationMs(e.substring(7).trim()), e);
            return
        }
        Mw.CronExpressionParser.parse(e, {
            tz: "UTC"
        })
    }
}
