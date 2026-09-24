// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: emitDrainOutputRecords  (minified: $c, daemon.pretty.js:72153)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function emitDrainOutputRecords(e, t, n) {
    let r = [],
        {
            targetSessionKeys: i
        } = uke(n.item, n.event, t),
        o = i.length,
        s, a = n.item.replySessionKey?.trim();
    for (let [u, l] of i.entries()) {
        let c = Aft(l, n.event.source.kind),
            d = n.turnMeta !== void 0 && classifySessionKeyOrUnknown(l) === "channel",
            f = createOutboxRecord({
                channel_kind: c,
                session_key: l,
                in_reply_to_event_id: n.event.id,
                routing: {
                    policy: u === 0 ? a ? "reply_override" : "reply_to_origin" : "fanout",
                    origin_event_id: n.event.id,
                    origin_session_key: n.event.session_key ?? t,
                    origin_channel_kind: n.event.source.kind,
                    fanout_index: u + 1,
                    fanout_total: o
                },
                payload: {
                    text: n.outputText,
                    attachments: n.attachments && n.attachments.length > 0 ? n.attachments : void 0,
                    data: d ? {
                        turn_meta: n.turnMeta
                    } : void 0
                }
            });
        await Wl(e, f), r.push(f);
        let p = {
            outbox_id: f.id,
            text: f.payload.text,
            session_id: n.sdkSessionId ?? void 0,
            reply_target: a ?? void 0,
            fanout_index: u + 1,
            fanout_total: o
        };
        n.batchedEventIds && n.batchedEventIds.length > 1 && (p.batched_event_ids = n.batchedEventIds);
        let m = createSpineEvent({
            type: "agent.result",
            source: {
                kind: "runner",
                name: "runner"
            },
            session_key: l,
            payload: p
        });
        await atomicAppendEvent(e, m), u === 0 && (s = f)
    }
    return {
        records: r,
        primaryRecord: s
    }
}
