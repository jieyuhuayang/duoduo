// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: validateJobScheduleExpression  (minified: Rye, daemon.pretty.js:61008)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
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
        cw.CronExpressionParser.parse(e, {
            tz: "UTC"
        })
    }
}
