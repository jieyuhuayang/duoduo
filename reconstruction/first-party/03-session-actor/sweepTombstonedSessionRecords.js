// duoduo reconstruction — subsystem: 03-session-actor
// symbol: sweepTombstonedSessionRecords  (minified: qgt, daemon.pretty.js:86383)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function sweepTombstonedSessionRecords(e) {
    let t = 0,
        n = 0,
        r = 0,
        i;
    try {
        i = await Pb(e)
    } catch (s) {
        Z("[housekeeping] failed to list outbox records — sweep skipped", {
            error: s
        }), i = []
    }
    for (let s of i)
        if (s.status !== "pending" && Ks(e, s.session_key)) try {
            await p0e.unlink(Tb(e, s.channel_kind, s.id)), t += 1
        } catch (a) {
            a.code !== "ENOENT" && Z("[housekeeping] failed to remove tombstoned outbox record", {
                sessionKey: s.session_key,
                recordId: s.id,
                error: a
            })
        }
    let o = new Set(i.map(s => s.session_key));
    for (let s of await yle(e)) o.add(s), !f0e(Jn(e, s)) && !f0e(Sm(e, s)) && (r += 1);
    for (let s of o) {
        if (!Ks(e, s)) continue;
        let a = hs(e, s);
        try {
            await p0e.unlink(a), n += 1
        } catch (u) {
            u.code !== "ENOENT" && Z("[housekeeping] failed to remove tombstoned replay log", {
                sessionKey: s,
                error: u
            })
        }
    }
    return t > 0 || n > 0 ? Q("[housekeeping] swept tombstoned-session records", {
        outboxRemoved: t,
        replayLogsRemoved: n,
        replayLogsWithoutSessionDir: r
    }) : Ee("[housekeeping] no tombstoned-session records to sweep", {
        replayDir: MR(e),
        replayLogsWithoutSessionDir: r
    }), {
        outboxRemoved: t,
        replayLogsRemoved: n,
        replayLogsWithoutSessionDir: r
    }
}
