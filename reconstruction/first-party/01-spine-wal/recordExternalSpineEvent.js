// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: recordExternalSpineEvent  (minified: Bxe, daemon.pretty.js:91914)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.4 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 9 renamed — 3 from the code at the binding (rule), 6 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.4 (high): `spine.record` appends an `external.record` event for writers outside duoduo, with optional per-source deduplication.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function recordExternalSpineEvent(paths, params) {
    let problem = describeSpineRecordProblem(params);
    if (problem !== null) throw new SpineRpcParamsError(renderParamsProblem("spine.record", problem));
    let recordParams = params,
        reservedRefusal = checkReservedRecordSource(recordParams.source);
    if (reservedRefusal !== null) return reservedRefusal;
    let spineEvent = createSpineEvent({
            type: vA,
            source: {
                kind: recordParams.source
            },
            session_key: `${recordParams.source}:${recordParams.conversation}`,
            ...recordParams.dedup_key !== void 0 ? {
                dedup: {
                    source_id: `${recordParams.conversation}:${recordParams.dedup_key}`
                }
            } : {},
            payload: recordParams.payload
        }),
        dedupKey = computeDedupKey(spineEvent);
    if (dedupKey) {
        let dedupResult = await (await loadRegistryDedupStore(paths)).checkAndRecordDetailed({
            key: dedupKey,
            ts: spineEvent.ts,
            event_id: spineEvent.id
        });
        if (dedupResult.duplicate && dedupResult.existing?.event_id) {
            let eventById = await readEventById(paths, dedupResult.existing.event_id, {
                notAfter: dedupResult.existing.ts
            });
            if (eventById) return {
                ok: !0,
                event_id: eventById.id,
                ts: eventById.ts,
                duplicate: !0
            }
        }
    }
    return await atomicAppendEvent(paths, spineEvent), {
        ok: !0,
        event_id: spineEvent.id,
        ts: spineEvent.ts,
        duplicate: !1
    }
}
