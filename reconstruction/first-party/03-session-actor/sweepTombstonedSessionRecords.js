// duoduo reconstruction — subsystem: 03-session-actor
// symbol: sweepTombstonedSessionRecords  (minified: qlt, daemon.pretty.js:79557)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function sweepTombstonedSessionRecords(e) {
    let t = 0,
        n = 0,
        r = 0,
        i;
    try {
        i = await m_(e)
    } catch (s) {
        J("[housekeeping] failed to list outbox records — sweep skipped", {
            error: s
        }), i = []
    }
    for (let s of i)
        if (s.status !== "pending" && ws(e, s.session_key)) try {
            await lwe.unlink(p_(e, s.channel_kind, s.id)), t += 1
        } catch (a) {
            a.code !== "ENOENT" && J("[housekeeping] failed to remove tombstoned outbox record", {
                sessionKey: s.session_key,
                recordId: s.id,
                error: a
            })
        }
    let o = new Set(i.map(s => s.session_key));
    for (let s of await Zoe(e)) o.add(s), !awe(Yn(e, s)) && !awe($p(e, s)) && (r += 1);
    for (let s of o) {
        if (!ws(e, s)) continue;
        let a = Wo(e, s);
        try {
            await lwe.unlink(a), n += 1
        } catch (l) {
            l.code !== "ENOENT" && J("[housekeeping] failed to remove tombstoned replay log", {
                sessionKey: s,
                error: l
            })
        }
    }
    return t > 0 || n > 0 ? Q("[housekeeping] swept tombstoned-session records", {
        outboxRemoved: t,
        replayLogsRemoved: n,
        replayLogsWithoutSessionDir: r
    }) : ke("[housekeeping] no tombstoned-session records to sweep", {
        replayDir: ZE(e),
        replayLogsWithoutSessionDir: r
    }), {
        outboxRemoved: t,
        replayLogsRemoved: n,
        replayLogsWithoutSessionDir: r
    }
}
