// duoduo reconstruction — subsystem: 03-session-actor
// symbol: sweepTombstonedSessionRecords  (minified: $bt, daemon.pretty.js:86756)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function sweepTombstonedSessionRecords(e) {
    let t = 0,
        n = 0,
        r = 0,
        i;
    try {
        i = await Qb(e)
    } catch (s) {
        Z("[housekeeping] failed to list outbox records — sweep skipped", {
            error: s
        }), i = []
    }
    for (let s of i)
        if (s.status !== "pending" && isSessionArchived(e, s.session_key)) try {
            await oIe.unlink(resolveOutboxRecordPath(e, s.channel_kind, s.id)), t += 1
        } catch (a) {
            a.code !== "ENOENT" && Z("[housekeeping] failed to remove tombstoned outbox record", {
                sessionKey: s.session_key,
                recordId: s.id,
                error: a
            })
        }
    let o = new Set(i.map(s => s.session_key));
    for (let s of await Nce(e)) o.add(s), !iIe(resolveSessionDir(e, s)) && !iIe(resolveArchivedSessionDir(e, s)) && (r += 1);
    for (let s of o) {
        if (!isSessionArchived(e, s)) continue;
        let a = ws(e, s);
        try {
            await oIe.unlink(a), n += 1
        } catch (u) {
            u.code !== "ENOENT" && Z("[housekeeping] failed to remove tombstoned replay log", {
                sessionKey: s,
                error: u
            })
        }
    }
    return t > 0 || n > 0 ? ee("[housekeeping] swept tombstoned-session records", {
        outboxRemoved: t,
        replayLogsRemoved: n,
        replayLogsWithoutSessionDir: r
    }) : ke("[housekeeping] no tombstoned-session records to sweep", {
        replayDir: resolveOutboxReplayDir(e),
        replayLogsWithoutSessionDir: r
    }), {
        outboxRemoved: t,
        replayLogsRemoved: n,
        replayLogsWithoutSessionDir: r
    }
}
