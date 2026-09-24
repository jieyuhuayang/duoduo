// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: appendBeforeExecuteGateway  (minified: Kle, daemon.pretty.js:87214)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function appendBeforeExecuteGateway(e, t, n) {
    t.sourceChannelId !== void 0 && Eb(t.sourceChannelId);
    let r = createSpineEvent({
            type: t.eventType,
            source: {
                kind: t.sourceKind,
                name: t.sourceName,
                channel_id: t.sourceChannelId
            },
            session_key: t.sessionKey,
            payload: t.eventType === "channel.command" ? {
                command: t.command ?? t.text,
                text: t.text,
                ...t.rawCommand ? {
                    raw_command: t.rawCommand
                } : {},
                ...typeof t.idle_ms == "number" && Number.isFinite(t.idle_ms) && t.idle_ms >= 0 ? {
                    idle_ms: t.idle_ms
                } : {},
                ...typeof t.threshold_at_fire == "number" && Number.isFinite(t.threshold_at_fire) && t.threshold_at_fire >= 0 ? {
                    threshold_at_fire: t.threshold_at_fire
                } : {}
            } : {
                text: t.text,
                media: t.attachments,
                reply_fanout_session_keys: t.replyFanoutSessionKeys,
                ...t.rawCommand ? {
                    raw_command: t.rawCommand
                } : {}
            },
            dedup: t.dedupSourceId ? {
                source_id: t.dedupSourceId
            } : void 0,
            routing_hint: t.routingHint ? {
                target: t.routingHint.target,
                intent: t.routingHint.intent,
                tags: t.routingHint.tags
            } : void 0
        }),
        i = await loadRegistryDedupStore(e),
        o = computeDedupKey(r);
    if (o) {
        let f = await i.checkAndRecordDetailed({
            key: o,
            ts: r.ts,
            event_id: r.id
        });
        if (f.duplicate && f.existing?.event_id) {
            let p = await readEventById(e, f.existing.event_id, {
                notAfter: f.existing.ts
            });
            if (p) {
                let m = await findOutboxRecordByEventId(e, p.id);
                return await zle(e, t.sourceKind, t.sourceChannelId), {
                    event: p,
                    routing: {
                        target: readRoutingTarget(p),
                        enqueued: !1
                    },
                    deduplicated: !0,
                    gatewayResponse: m?.payload.text,
                    gatewayOutboxId: m?.id
                }
            }
        }
    }
    let s = await writeIngressSnapshot(e, {
        sessionKey: t.sessionKey,
        sourceKind: t.sourceKind,
        sourceName: t.sourceName,
        text: t.text,
        attachments: t.attachments,
        replyFanoutSessionKeys: t.replyFanoutSessionKeys,
        dedupSourceId: t.dedupSourceId,
        rawPayload: t.rawPayload,
        routingHint: t.routingHint
    }, r);
    r.payload && (r.payload.raw_path = s), await atomicAppendEvent(e, r), await advanceConsumerWatermark(e, "gateway", r.id, new Date(r.ts)), await updateRegistryStatus(e, f => ({
        ...f,
        spine: {
            ...f.spine,
            event_log: ef.join(e.eventsDir, formatEventPartitionName(new Date(r.ts)))
        },
        health: {
            ...f.health,
            gateway: "ok"
        }
    }), new Date(r.ts));
    let a, u = !1,
        l, c, d = readRoutingTarget(r);
    if (d === "gateway") {
        let f = await replyToGatewayCommandEvent(e, r, n?.bus, n?.gatewayCommands);
        l = f.responseText, c = f.outboxId, Re("[gateway] gateway-targeted event (no enqueue)", {
            id: r.id,
            type: r.type,
            intent: r.routing_hint?.intent,
            raw_path: s,
            handled: f.handled
        })
    } else if (d === "meta") {
        let f = "meta:subconscious",
            p = `- [ ] @evt(${r.id})`;
        a = await enqueueSessionInboxLine(e, f, p), u = !0, po("mailbox_enqueued", r.id, {
            sessionKey: f
        }), Re("[gateway] meta-targeted event", {
            id: r.id,
            type: r.type,
            raw_path: s,
            mailboxFile: a
        })
    } else {
        let f = `- [ ] @evt(${r.id})`;
        a = await enqueueSessionInboxLine(e, t.sessionKey, f), u = !0, po("mailbox_enqueued", r.id, {
            sessionKey: t.sessionKey
        }), Re("[gateway] session-targeted event", {
            id: r.id,
            type: r.type,
            session_key: t.sessionKey,
            raw_path: s,
            mailboxFile: a
        })
    }
    return n?.bus && n.bus.emit("spine.event", r), await zle(e, t.sourceKind, t.sourceChannelId), {
        event: r,
        mailboxFile: a,
        routing: {
            target: d,
            enqueued: u
        },
        gatewayResponse: l,
        gatewayOutboxId: c
    }
}
