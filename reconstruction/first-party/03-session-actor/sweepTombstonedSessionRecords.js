// duoduo reconstruction — subsystem: 03-session-actor
// symbol: sweepTombstonedSessionRecords  (minified: wct, daemon.pretty.js:80383)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function sweepTombstonedSessionRecords(e) {
    let t = 0,
        n = 0,
        r = 0,
        i;
    try {
        i = await P_(e)
    } catch (s) {
        W("[housekeeping] failed to list outbox records — sweep skipped", {
            error: s
        }), i = []
    }
    for (let s of i)
        if (s.status !== "pending" && Cs(e, s.session_key)) try {
            await lSe.unlink(I_(e, s.channel_kind, s.id)), t += 1
        } catch (a) {
            a.code !== "ENOENT" && W("[housekeeping] failed to remove tombstoned outbox record", {
                sessionKey: s.session_key,
                recordId: s.id,
                error: a
            })
        }
    let o = new Set(i.map(s => s.session_key));
    for (let s of await Fse(e)) o.add(s), !aSe(Xn(e, s)) && !aSe(Vp(e, s)) && (r += 1);
    for (let s of o) {
        if (!Cs(e, s)) continue;
        let a = es(e, s);
        try {
            await lSe.unlink(a), n += 1
        } catch (l) {
            l.code !== "ENOENT" && W("[housekeeping] failed to remove tombstoned replay log", {
                sessionKey: s,
                error: l
            })
        }
    }
    return t > 0 || n > 0 ? ee("[housekeeping] swept tombstoned-session records", {
        outboxRemoved: t,
        replayLogsRemoved: n,
        replayLogsWithoutSessionDir: r
    }) : ke("[housekeeping] no tombstoned-session records to sweep", {
        replayDir: f0(e),
        replayLogsWithoutSessionDir: r
    }), {
        outboxRemoved: t,
        replayLogsRemoved: n,
        replayLogsWithoutSessionDir: r
    }
}
