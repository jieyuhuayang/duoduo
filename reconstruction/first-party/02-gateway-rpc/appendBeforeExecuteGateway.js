// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: appendBeforeExecuteGateway  (minified: xse, daemon.pretty.js:80293)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function appendBeforeExecuteGateway(e, t, n) {
    t.sourceChannelId !== void 0 && u_(t.sourceChannelId);
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
        i = await W3e(e),
        o = computeDedupKey(r);
    if (o) {
        let p = await i.checkAndRecordDetailed({
            key: o,
            ts: r.ts,
            event_id: r.id
        });
        if (p.duplicate && p.existing?.event_id) {
            let f = await td(e, p.existing.event_id, {
                notAfter: p.existing.ts
            });
            if (f) {
                let m = await Yp(e, f.id);
                return await mse(e, t.sourceKind, t.sourceChannelId), {
                    event: f,
                    routing: {
                        target: yse(f),
                        enqueued: !1
                    },
                    deduplicated: !0,
                    gatewayResponse: m?.payload.text,
                    gatewayOutboxId: m?.id
                }
            }
        }
    }
    let s = await e9e(e, {
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
    r.payload && (r.payload.raw_path = s), await atomicAppendEvent(e, r), await advanceConsumerWatermark(e, "gateway", r.id, new Date(r.ts)), await ol(e, p => ({
        ...p,
        spine: {
            ...p.spine,
            event_log: bd.join(e.eventsDir, Op(new Date(r.ts)))
        },
        health: {
            ...p.health,
            gateway: "ok"
        }
    }), new Date(r.ts));
    let a, l = !1,
        u, c, d = yse(r);
    if (d === "gateway") {
        let p = await G3e(e, r, n?.bus, n?.gatewayCommands);
        u = p.responseText, c = p.outboxId, ke("[gateway] gateway-targeted event (no enqueue)", {
            id: r.id,
            type: r.type,
            intent: r.routing_hint?.intent,
            raw_path: s,
            handled: p.handled
        })
    } else if (d === "meta") {
        let p = "meta:subconscious",
            f = `- [ ] @evt(${r.id})`;
        a = await ks(e, p, f), l = !0, Bi("mailbox_enqueued", r.id, {
            sessionKey: p
        }), ke("[gateway] meta-targeted event", {
            id: r.id,
            type: r.type,
            raw_path: s,
            mailboxFile: a
        })
    } else {
        let p = `- [ ] @evt(${r.id})`;
        a = await ks(e, t.sessionKey, p), l = !0, Bi("mailbox_enqueued", r.id, {
            sessionKey: t.sessionKey
        }), ke("[gateway] session-targeted event", {
            id: r.id,
            type: r.type,
            session_key: t.sessionKey,
            raw_path: s,
            mailboxFile: a
        })
    }
    return n?.bus && n.bus.emit("spine.event", r), await mse(e, t.sourceKind, t.sourceChannelId), {
        event: r,
        mailboxFile: a,
        routing: {
            target: d,
            enqueued: l
        },
        gatewayResponse: u,
        gatewayOutboxId: c
    }
}
