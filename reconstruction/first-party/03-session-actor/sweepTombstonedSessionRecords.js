// duoduo reconstruction — subsystem: 03-session-actor
// symbol: sweepTombstonedSessionRecords  (minified: Pot, daemon.pretty.js:78007)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function sweepTombstonedSessionRecords(e) {
    let t = 0,
        n = 0,
        r;
    try {
        r = await jp(e)
    } catch (o) {
        Z("[housekeeping] failed to list outbox records — sweep skipped", {
            error: o
        }), r = []
    }
    for (let o of r)
        if (o.status !== "pending" && ws(e, o.session_key)) try {
            await V_e.unlink(s_(e, o.channel_kind, o.id)), t += 1
        } catch (s) {
            s.code !== "ENOENT" && Z("[housekeeping] failed to remove tombstoned outbox record", {
                sessionKey: o.session_key,
                recordId: o.id,
                error: s
            })
        }
    let i = new Set(r.map(o => o.session_key));
    for (let o of await Nie(e)) i.add(o), !H_e(Fr(e, o)) && !H_e(gp(e, o)) && Z("[housekeeping] replay log decodes to a session key with no active or archived dir — skipping (decode may be lossy)", {
        sessionKey: o
    });
    for (let o of i) {
        if (!ws(e, o)) continue;
        let s = tl(e, o);
        try {
            await V_e.unlink(s), n += 1
        } catch (a) {
            a.code !== "ENOENT" && Z("[housekeeping] failed to remove tombstoned replay log", {
                sessionKey: o,
                error: a
            })
        }
    }
    return t > 0 || n > 0 ? K("[housekeeping] swept tombstoned-session records", {
        outboxRemoved: t,
        replayLogsRemoved: n
    }) : Ae("[housekeeping] no tombstoned-session records to sweep", {
        replayDir: _0(e)
    }), {
        outboxRemoved: t,
        replayLogsRemoved: n
    }
}
