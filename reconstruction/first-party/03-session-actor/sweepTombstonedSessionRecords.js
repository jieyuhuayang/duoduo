// duoduo reconstruction — subsystem: 03-session-actor
// symbol: sweepTombstonedSessionRecords  (minified: $bt, daemon.pretty.js:86756)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.5.6 — first release whose bundle holds this declaration; body changed in v0.8.0 (maps/history_daemon.json)
// locals: 14 renamed — 4 from the code at the binding (rule), 10 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function sweepTombstonedSessionRecords(paths) {
    let outboxRemoved = 0,
        replayLogsRemoved = 0,
        replayLogsWithoutSessionDir = 0,
        records;
    try {
        records = await listAllOutboxRecords(paths)
    } catch (err) {
        logWarnMessage("[housekeeping] failed to list outbox records — sweep skipped", {
            error: err
        }), records = []
    }
    for (let record of records)
        if (record.status !== "pending" && isSessionArchived(paths, record.session_key)) try {
            await oIe.unlink(resolveOutboxRecordPath(paths, record.channel_kind, record.id)), outboxRemoved += 1
        } catch (err) {
            err.code !== "ENOENT" && logWarnMessage("[housekeeping] failed to remove tombstoned outbox record", {
                sessionKey: record.session_key,
                recordId: record.id,
                error: err
            })
        }
    let sessionKeys = new Set(records.map(record => record.session_key));
    for (let sessionKey of await Nce(paths)) sessionKeys.add(sessionKey), !iIe(resolveSessionDir(paths, sessionKey)) && !iIe(resolveArchivedSessionDir(paths, sessionKey)) && (replayLogsWithoutSessionDir += 1);
    for (let sessionKey of sessionKeys) {
        if (!isSessionArchived(paths, sessionKey)) continue;
        let outboxReplayFilePath = resolveOutboxReplayFilePath(paths, sessionKey);
        try {
            await oIe.unlink(outboxReplayFilePath), replayLogsRemoved += 1
        } catch (err) {
            err.code !== "ENOENT" && logWarnMessage("[housekeeping] failed to remove tombstoned replay log", {
                sessionKey,
                error: err
            })
        }
    }
    return outboxRemoved > 0 || replayLogsRemoved > 0 ? logInfoMessage("[housekeeping] swept tombstoned-session records", {
        outboxRemoved,
        replayLogsRemoved,
        replayLogsWithoutSessionDir
    }) : logDebugMessage("[housekeeping] no tombstoned-session records to sweep", {
        replayDir: resolveOutboxReplayDir(paths),
        replayLogsWithoutSessionDir
    }), {
        outboxRemoved,
        replayLogsRemoved,
        replayLogsWithoutSessionDir
    }
}
