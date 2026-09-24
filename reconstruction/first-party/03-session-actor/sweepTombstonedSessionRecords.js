// duoduo reconstruction — subsystem: 03-session-actor
// symbol: sweepTombstonedSessionRecords  (minified: Jgt, daemon.pretty.js:86403)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
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
        if (s.status !== "pending" && isSessionArchived(e, s.session_key)) try {
            await h0e.unlink(resolveOutboxRecordPath(e, s.channel_kind, s.id)), t += 1
        } catch (a) {
            a.code !== "ENOENT" && Z("[housekeeping] failed to remove tombstoned outbox record", {
                sessionKey: s.session_key,
                recordId: s.id,
                error: a
            })
        }
    let o = new Set(i.map(s => s.session_key));
    for (let s of await _le(e)) o.add(s), !m0e(resolveSessionDir(e, s)) && !m0e(resolveArchivedSessionDir(e, s)) && (r += 1);
    for (let s of o) {
        if (!isSessionArchived(e, s)) continue;
        let a = hs(e, s);
        try {
            await h0e.unlink(a), n += 1
        } catch (u) {
            u.code !== "ENOENT" && Z("[housekeeping] failed to remove tombstoned replay log", {
                sessionKey: s,
                error: u
            })
        }
    }
    return t > 0 || n > 0 ? te("[housekeeping] swept tombstoned-session records", {
        outboxRemoved: t,
        replayLogsRemoved: n,
        replayLogsWithoutSessionDir: r
    }) : Re("[housekeeping] no tombstoned-session records to sweep", {
        replayDir: resolveOutboxReplayDir(e),
        replayLogsWithoutSessionDir: r
    }), {
        outboxRemoved: t,
        replayLogsRemoved: n,
        replayLogsWithoutSessionDir: r
    }
}
