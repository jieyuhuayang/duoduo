// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: parseJobRearmTime  (minified: Lw, daemon.pretty.js:61344)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.6 — first release whose bundle holds this declaration; body changed in v0.6.1 (maps/history_daemon.json)
// changelog v0.5.6 (medium): The loop runs as a job, paces itself via `ScheduleWakeup`
// changelog v0.6.1 (medium): `@in` and `@every` now accept composite durations such as `2h30m` and `1d6h4m`. Invalid cron strings, malformed durations, and delays outside the representable time range are rejected when the job is created.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function parseJobRearmTime(e, t = new Date) {
    let n = e.trim();
    if (n.startsWith("@in ")) {
        let i = parseScheduleDurationMs(n.substring(4).trim());
        return assertScheduleDurationRepresentable(i, n), new Date(t.getTime() + i).toISOString()
    }
    let r = sut.test(n) ? new Date(n).getTime() : Number.NaN;
    if (!Number.isFinite(r)) throw new Error(`Invalid reschedule time: ${e}. Expected "@in <duration>" (e.g. "@in 30m") or an ISO 8601 timestamp with an explicit timezone — "Z" or a ±hh:mm offset (e.g. "2026-06-13T02:00:00Z", "2026-06-13T10:00:00+08:00"). Zone-less datetimes are rejected because scheduling is pinned to UTC.`);
    if (r <= t.getTime()) throw new Error(`Reschedule time is not in the future: ${e} (now: ${t.toISOString()}). A re-arm at or before now would be consumed as already spent at finalize, silently ending the loop. Accepted forms: "@in <duration>" (e.g. "@in 30m") or a FUTURE ISO 8601 timestamp with an explicit timezone.`);
    return new Date(r).toISOString()
}
