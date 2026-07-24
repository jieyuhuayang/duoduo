// duoduo reconstruction — subsystem: 03-session-actor
// symbol: sweepTombstonedSessionRecords  (minified: aet, daemon.pretty.js:74648)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function sweepTombstonedSessionRecords(e) {
    let t = 0,
        n = 0,
        r;
    try {
        r = await Gf(e)
    } catch (s) {
        ie("[housekeeping] failed to list outbox records — sweep skipped", {
            error: s
        }), r = []
    }
    for (let s of r)
        if (s.status !== "pending" && ro(e, s.session_key)) try {
            await Qme.unlink(dy(e, s.channel_kind, s.id)), t += 1
        } catch (o) {
            o.code !== "ENOENT" && ie("[housekeeping] failed to remove tombstoned outbox record", {
                sessionKey: s.session_key,
                recordId: s.id,
                error: o
            })
        }
    let i = new Set(r.map(s => s.session_key));
    for (let s of await sne(e)) i.add(s), !Yme(Pr(e, s)) && !Yme($f(e, s)) && ie("[housekeeping] replay log decodes to a session key with no active or archived dir — skipping (decode may be lossy)", {
        sessionKey: s
    });
    for (let s of i) {
        if (!ro(e, s)) continue;
        let o = ja(e, s);
        try {
            await Qme.unlink(o), n += 1
        } catch (a) {
            a.code !== "ENOENT" && ie("[housekeeping] failed to remove tombstoned replay log", {
                sessionKey: s,
                error: a
            })
        }
    }
    return t > 0 || n > 0 ? J("[housekeeping] swept tombstoned-session records", {
        outboxRemoved: t,
        replayLogsRemoved: n
    }) : Pe("[housekeeping] no tombstoned-session records to sweep", {
        replayDir: Uk(e)
    }), {
        outboxRemoved: t,
        replayLogsRemoved: n
    }
}
