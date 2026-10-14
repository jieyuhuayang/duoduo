// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: readOutboxRecordsPastCursor  (minified: Yw, daemon.pretty.js:64575)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.3.0 (maps/history_daemon.json)
// locals: 22 renamed — 8 from the code at the binding (rule), 14 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.3.0 (medium): **replay**: Harden session-local cursor fallback and recovery when replay indexes are incomplete or stale.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function readOutboxRecordsPastCursor(options) {
    let now = Date.now(),
        {
            paths,
            sessionKey,
            consumerId,
            limit,
            cursorOverride
        } = options,
        maxRecords = typeof limit == "number" && limit > 0 ? limit : 1 / 0,
        strategy = "offset",
        recordsRead = 0,
        cursorHadOffset = !1,
        offsetResynced = !1;
    try {
        let cursorFile = await Zw(paths, sessionKey, consumerId),
            cursor = Kw(cursorFile);
        cursorHadOffset = cursor.replay_offset !== void 0, await Fce(paths, sessionKey);
        let replayOffset;
        if (cursorOverride) {
            let outboxByIdIndexEntry = await lookupOutboxByIdIndexEntry(paths, cursorOverride);
            if (outboxByIdIndexEntry || (await backfillOutboxByIdIndexFromReplay(paths, sessionKey), outboxByIdIndexEntry = await lookupOutboxByIdIndexEntry(paths, cursorOverride)), !outboxByIdIndexEntry || outboxByIdIndexEntry.session_key !== sessionKey) {
                let fallback = await QC(options);
                return strategy = fallback.strategy, fallback.records
            }
            replayOffset = outboxByIdIndexEntry.replay_offset + outboxByIdIndexEntry.replay_byte_length
        }
        if (replayOffset === void 0 && cursor.replay_offset !== void 0 && (replayOffset = cursor.replay_offset), replayOffset === void 0 && cursor.last_outbox_id) {
            let outboxByIdIndexEntry = await lookupOutboxByIdIndexEntry(paths, cursor.last_outbox_id);
            if (outboxByIdIndexEntry && outboxByIdIndexEntry.session_key === sessionKey) replayOffset = outboxByIdIndexEntry.replay_offset + outboxByIdIndexEntry.replay_byte_length, strategy = "bootstrapped";
            else {
                let fallback = await QC(options);
                return strategy = fallback.strategy, fallback.records
            }
        }
        replayOffset === void 0 && (replayOffset = 0);
        let scan = await Uce(paths, sessionKey, replayOffset, maxRecords);
        if (recordsRead = scan.entries.length, offsetResynced = scan.resynced, scan.resynced && (strategy = "repair"), scan.damaged) {
            let fallback = await QC(options);
            return strategy = fallback.strategy, recordsRead = fallback.records.length, fallback.records
        }
        return await Rlt(paths, scan.entries)
    } catch {
        let fallback = await QC(options);
        return strategy = fallback.strategy, fallback.records
    } finally {
        await recordTelemetryMetric(paths, "replay_scan_ms", Date.now() - now, {
            sessionKey,
            consumerId,
            strategy,
            records_read: recordsRead,
            returned_count: recordsRead,
            cursor_had_offset: cursorHadOffset,
            offset_resynced: offsetResynced,
            cursorOverride: typeof cursorOverride == "string" && cursorOverride.length > 0
        })
    }
}
