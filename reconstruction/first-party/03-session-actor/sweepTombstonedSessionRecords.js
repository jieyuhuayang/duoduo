// duoduo reconstruction — subsystem: 03-session-actor
// symbol: sweepTombstonedSessionRecords  (minified: Eet, daemon.pretty.js:74826)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function sweepTombstonedSessionRecords(e) {
    let t = 0,
        n = 0,
        r;
    try {
        r = await Yf(e)
    } catch (s) {
        se("[housekeeping] failed to list outbox records — sweep skipped", {
            error: s
        }), r = []
    }
    for (let s of r)
        if (s.status !== "pending" && io(e, s.session_key)) try {
            await fhe.unlink(fy(e, s.channel_kind, s.id)), t += 1
        } catch (o) {
            o.code !== "ENOENT" && se("[housekeeping] failed to remove tombstoned outbox record", {
                sessionKey: s.session_key,
                recordId: s.id,
                error: o
            })
        }
    let i = new Set(r.map(s => s.session_key));
    for (let s of await cne(e)) i.add(s), !dhe(Ir(e, s)) && !dhe($f(e, s)) && se("[housekeeping] replay log decodes to a session key with no active or archived dir — skipping (decode may be lossy)", {
        sessionKey: s
    });
    for (let s of i) {
        if (!io(e, s)) continue;
        let o = ja(e, s);
        try {
            await fhe.unlink(o), n += 1
        } catch (a) {
            a.code !== "ENOENT" && se("[housekeeping] failed to remove tombstoned replay log", {
                sessionKey: s,
                error: a
            })
        }
    }
    return t > 0 || n > 0 ? K("[housekeeping] swept tombstoned-session records", {
        outboxRemoved: t,
        replayLogsRemoved: n
    }) : Pe("[housekeeping] no tombstoned-session records to sweep", {
        replayDir: qk(e)
    }), {
        outboxRemoved: t,
        replayLogsRemoved: n
    }
}
