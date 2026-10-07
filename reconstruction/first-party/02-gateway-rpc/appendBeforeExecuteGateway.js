// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: appendBeforeExecuteGateway  (minified: yde, daemon.pretty.js:87568)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.5.6, v0.5.10, v0.8.0, v0.8.4 (maps/history_daemon.json)
// changelog v0.8.0 (medium): Identical text sent twice was silently suppressed as a duplicate. Ingress de-duplication now keys only on an explicit source id, so resending a message always gets an answer.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function appendBeforeExecuteGateway(e, t, n) {
    t.sourceChannelId !== void 0 && assertValidChannelId(t.sourceChannelId);
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
                return await ade(e, t.sourceKind, t.sourceChannelId), {
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
    r.payload && (r.payload.raw_path = s), await atomicAppendEvent(e, r), await advanceConsumerWatermark(e, "gateway", r.id, new Date(r.ts)), await ade(e, t.sourceKind, t.sourceChannelId), await updateRegistryStatus(e, f => ({
        ...f,
        spine: {
            ...f.spine,
            event_log: mf.join(e.eventsDir, formatEventPartitionName(new Date(r.ts)))
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
        l = f.responseText, c = f.outboxId, logDebugMessage("[gateway] gateway-targeted event (no enqueue)", {
            id: r.id,
            type: r.type,
            intent: r.routing_hint?.intent,
            raw_path: s,
            handled: f.handled
        })
    } else if (d === "meta") {
        let f = "meta:subconscious",
            p = `- [ ] @evt(${r.id})`;
        a = await enqueueSessionInboxLine(e, f, p), u = !0, logLatencyStageTelemetry("mailbox_enqueued", r.id, {
            sessionKey: f
        }), logDebugMessage("[gateway] meta-targeted event", {
            id: r.id,
            type: r.type,
            raw_path: s,
            mailboxFile: a
        })
    } else if (await isVoidRuntimeSession(e, t.sessionKey, t.sourceChannelId)) {
        let f = typeof r.payload?.raw_command == "string" ? r.payload.raw_command : typeof r.payload?.command == "string" ? r.payload.command : t.text,
            p = parseInjectionPromptCommand(f) !== void 0 || parseGatewayCommandText(f) !== void 0,
            m = await writeVoidSessionOutboxRecord(e, n?.bus, {
                sessionKey: t.sessionKey,
                text: p ? `${Ju} ${f} was not run.` : t.text,
                attachments: p ? void 0 : t.attachments,
                data: {
                    event_id: r.id,
                    event_ts: r.ts
                }
            });
        p && (l = m.payload.text, c = m.id), logDebugMessage("[gateway] void-session event (outbox, no enqueue)", {
            id: r.id,
            type: r.type,
            session_key: t.sessionKey,
            outbox_id: m.id
        })
    } else {
        let f = `- [ ] @evt(${r.id})`;
        a = await enqueueSessionInboxLine(e, t.sessionKey, f), u = !0, logLatencyStageTelemetry("mailbox_enqueued", r.id, {
            sessionKey: t.sessionKey
        }), logDebugMessage("[gateway] session-targeted event", {
            id: r.id,
            type: r.type,
            session_key: t.sessionKey,
            raw_path: s,
            mailboxFile: a
        })
    }
    return n?.bus && n.bus.emit("spine.event", r), {
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
