// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: isJobScheduleDue  (minified: Uve, daemon.pretty.js:63438)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.6 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 15 renamed — 4 from the code at the binding (rule), 11 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.6 (medium): The loop runs as a job, paces itself via `ScheduleWakeup`
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isJobScheduleDue(schedule, lastRunAt, now = new Date, createdAt, runAt) {
    if (typeof runAt == "string" && runAt.length > 0) {
        let runAtMs = new Date(runAt).getTime();
        if (Number.isFinite(runAtMs)) {
            if (now.getTime() >= runAtMs) return !0;
            if ((schedule === "once" || schedule.startsWith("@in ")) && lastRunAt === null) return !1
        }
    }
    let createdAtMs = typeof createdAt == "string" && createdAt.length > 0 ? new Date(createdAt).getTime() : Number.NaN,
        hasCreatedAt = Number.isFinite(createdAtMs);
    if (schedule === "once" || schedule === "keepalive") return lastRunAt !== null ? !1 : hasCreatedAt ? now.getTime() >= createdAtMs : !0;
    if (schedule.startsWith("@in ")) {
        let trimmed = schedule.substring(4).trim();
        try {
            let scheduleDurationMs = parseScheduleDurationMs(trimmed);
            return lastRunAt !== null ? !1 : hasCreatedAt ? now.getTime() - createdAtMs >= scheduleDurationMs : !0
        } catch {
            return !1
        }
    }
    if (schedule.startsWith("@every ")) {
        let trimmed = schedule.substring(7).trim();
        try {
            let scheduleDurationMs = parseScheduleDurationMs(trimmed);
            if (!lastRunAt) return hasCreatedAt ? now.getTime() >= createdAtMs : !0;
            let lastRunMs = new Date(lastRunAt).getTime();
            return now.getTime() - lastRunMs >= scheduleDurationMs
        } catch {
            return !1
        }
    }
    try {
        if (!lastRunAt) return hasCreatedAt ? Gw.CronExpressionParser.parse(schedule, {
            currentDate: new Date(createdAtMs),
            tz: "UTC"
        }).next().toDate().getTime() <= now.getTime() : (Gw.CronExpressionParser.parse(schedule, {
            currentDate: now,
            tz: "UTC"
        }), !0);
        let nextRunDate = Gw.CronExpressionParser.parse(schedule, {
                currentDate: new Date(lastRunAt),
                tz: "UTC"
            }).next().toDate(),
            lastRunTimeMs = new Date(lastRunAt).getTime();
        return Number.isNaN(lastRunTimeMs) ? !0 : nextRunDate.getTime() <= now.getTime()
    } catch {
        return !1
    }
}
