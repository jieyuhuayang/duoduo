// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: emitDrainOutputRecords  (minified: qc, daemon.pretty.js:72456)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.5.5 (maps/history_daemon.json)
// locals: 15 renamed — 4 from the code at the binding (rule), 11 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function emitDrainOutputRecords(paths, sessionKey, params) {
    let records = [],
        {
            targetSessionKeys
        } = resolveReplyTargetSessionKeys(params.item, params.event, sessionKey),
        length = targetSessionKeys.length,
        primaryRecord, replyOverride = params.item.replySessionKey?.trim();
    for (let [index, targetSessionKey] of targetSessionKeys.entries()) {
        let channelKind = _ht(targetSessionKey, params.event.source.kind),
            includeTurnMeta = params.turnMeta !== void 0 && classifySessionKeyOrUnknown(targetSessionKey) === "channel",
            outboxRecord = createOutboxRecord({
                channel_kind: channelKind,
                session_key: targetSessionKey,
                in_reply_to_event_id: params.event.id,
                routing: {
                    policy: index === 0 ? replyOverride ? "reply_override" : "reply_to_origin" : "fanout",
                    origin_event_id: params.event.id,
                    origin_session_key: params.event.session_key ?? sessionKey,
                    origin_channel_kind: params.event.source.kind,
                    fanout_index: index + 1,
                    fanout_total: length
                },
                payload: {
                    text: params.outputText,
                    attachments: params.attachments && params.attachments.length > 0 ? params.attachments : void 0,
                    data: includeTurnMeta ? {
                        turn_meta: params.turnMeta
                    } : void 0
                }
            });
        await persistOutboxRecord(paths, outboxRecord), records.push(outboxRecord);
        let resultPayload = {
            outbox_id: outboxRecord.id,
            text: outboxRecord.payload.text,
            session_id: params.sdkSessionId ?? void 0,
            reply_target: replyOverride ?? void 0,
            fanout_index: index + 1,
            fanout_total: length
        };
        params.batchedEventIds && params.batchedEventIds.length > 1 && (resultPayload.batched_event_ids = params.batchedEventIds);
        let spineEvent = createSpineEvent({
            type: "agent.result",
            source: {
                kind: "runner",
                name: "runner"
            },
            session_key: targetSessionKey,
            payload: resultPayload
        });
        await atomicAppendEvent(paths, spineEvent), index === 0 && (primaryRecord = outboxRecord)
    }
    return {
        records,
        primaryRecord
    }
}
