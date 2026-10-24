// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: appendBeforeExecuteGateway  (minified: cpe, daemon.pretty.js:89696)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.5.6, v0.5.10, v0.8.0, v0.8.4 (maps/history_daemon.json)
// locals: 23 renamed — 6 from the code at the binding (rule), 17 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.0 (medium): Identical text sent twice was silently suppressed as a duplicate. Ingress de-duplication now keys only on an explicit source id, so resending a message always gets an answer.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function appendBeforeExecuteGateway(paths, request, options) {
    request.sourceChannelId !== void 0 && assertValidChannelId(request.sourceChannelId);
    let spineEvent = createSpineEvent({
            type: request.eventType,
            source: {
                kind: request.sourceKind,
                name: request.sourceName,
                channel_id: request.sourceChannelId
            },
            session_key: request.sessionKey,
            payload: request.eventType === "channel.command" ? {
                command: request.command ?? request.text,
                text: request.text,
                ...request.rawCommand ? {
                    raw_command: request.rawCommand
                } : {},
                ...typeof request.idle_ms == "number" && Number.isFinite(request.idle_ms) && request.idle_ms >= 0 ? {
                    idle_ms: request.idle_ms
                } : {},
                ...typeof request.threshold_at_fire == "number" && Number.isFinite(request.threshold_at_fire) && request.threshold_at_fire >= 0 ? {
                    threshold_at_fire: request.threshold_at_fire
                } : {}
            } : {
                text: request.text,
                media: request.attachments,
                reply_fanout_session_keys: request.replyFanoutSessionKeys,
                ...request.rawCommand ? {
                    raw_command: request.rawCommand
                } : {}
            },
            dedup: request.dedupSourceId ? {
                source_id: request.dedupSourceId
            } : void 0,
            routing_hint: request.routingHint ? {
                target: request.routingHint.target,
                intent: request.routingHint.intent,
                tags: request.routingHint.tags
            } : void 0
        }),
        registryDedupStore = await loadRegistryDedupStore(paths),
        dedupKey = computeDedupKey(spineEvent);
    if (dedupKey) {
        let dedupResult = await registryDedupStore.checkAndRecordDetailed({
            key: dedupKey,
            ts: spineEvent.ts,
            event_id: spineEvent.id
        });
        if (dedupResult.duplicate && dedupResult.existing?.event_id) {
            let eventById = await readEventById(paths, dedupResult.existing.event_id, {
                notAfter: dedupResult.existing.ts
            });
            if (eventById) {
                let outboxRecordByEventId = await findOutboxRecordByEventId(paths, eventById.id);
                return await epe(paths, request.sourceKind, request.sourceChannelId), {
                    event: eventById,
                    routing: {
                        target: readRoutingTarget(eventById),
                        enqueued: !1
                    },
                    deduplicated: !0,
                    gatewayResponse: outboxRecordByEventId?.payload.text,
                    gatewayOutboxId: outboxRecordByEventId?.id
                }
            }
        }
    }
    let rawPath = await writeIngressSnapshot(paths, {
        sessionKey: request.sessionKey,
        sourceKind: request.sourceKind,
        sourceName: request.sourceName,
        text: request.text,
        attachments: request.attachments,
        replyFanoutSessionKeys: request.replyFanoutSessionKeys,
        dedupSourceId: request.dedupSourceId,
        rawPayload: request.rawPayload,
        routingHint: request.routingHint
    }, spineEvent);
    spineEvent.payload && (spineEvent.payload.raw_path = rawPath), await atomicAppendEvent(paths, spineEvent), await advanceConsumerWatermark(paths, "gateway", spineEvent.id, new Date(spineEvent.ts)), await epe(paths, request.sourceKind, request.sourceChannelId), await updateStatus(paths, status => ({
        ...status,
        spine: {
            ...status.spine,
            event_log: vf.join(paths.eventsDir, formatEventPartitionName(new Date(spineEvent.ts)))
        },
        health: {
            ...status.health,
            gateway: "ok"
        }
    }), new Date(spineEvent.ts));
    let mailboxFile, enqueued = !1,
        gatewayResponse, gatewayOutboxId, routingTarget = readRoutingTarget(spineEvent);
    if (routingTarget === "gateway") {
        let commandReply = await replyToGatewayCommandEvent(paths, spineEvent, options?.bus, options?.gatewayCommands);
        gatewayResponse = commandReply.responseText, gatewayOutboxId = commandReply.outboxId, logDebugMessage("[gateway] gateway-targeted event (no enqueue)", {
            id: spineEvent.id,
            type: spineEvent.type,
            intent: spineEvent.routing_hint?.intent,
            raw_path: rawPath,
            handled: commandReply.handled
        })
    } else if (routingTarget === "meta") {
        let metaSessionKey = "meta:subconscious",
            mailboxLine = `- [ ] @evt(${spineEvent.id})`;
        mailboxFile = await enqueueSessionInboxLine(paths, metaSessionKey, mailboxLine), enqueued = !0, logLatencyStageTelemetry("mailbox_enqueued", spineEvent.id, {
            sessionKey: metaSessionKey
        }), logDebugMessage("[gateway] meta-targeted event", {
            id: spineEvent.id,
            type: spineEvent.type,
            raw_path: rawPath,
            mailboxFile
        })
    } else if (await isVoidRuntimeSession(paths, request.sessionKey, request.sourceChannelId)) {
        let commandText = typeof spineEvent.payload?.raw_command == "string" ? spineEvent.payload.raw_command : typeof spineEvent.payload?.command == "string" ? spineEvent.payload.command : request.text,
            isCommand = parseInjectionPromptCommand(commandText) !== void 0 || parseGatewayCommandText(commandText) !== void 0,
            outboxRecord = await writeVoidSessionOutboxRecord(paths, options?.bus, {
                sessionKey: request.sessionKey,
                text: isCommand ? `${Ju} ${commandText} was not run.` : request.text,
                attachments: isCommand ? void 0 : request.attachments,
                data: {
                    event_id: spineEvent.id,
                    event_ts: spineEvent.ts
                }
            });
        isCommand && (gatewayResponse = outboxRecord.payload.text, gatewayOutboxId = outboxRecord.id), logDebugMessage("[gateway] void-session event (outbox, no enqueue)", {
            id: spineEvent.id,
            type: spineEvent.type,
            session_key: request.sessionKey,
            outbox_id: outboxRecord.id
        })
    } else {
        let mailboxLine = `- [ ] @evt(${spineEvent.id})`;
        mailboxFile = await enqueueSessionInboxLine(paths, request.sessionKey, mailboxLine), enqueued = !0, logLatencyStageTelemetry("mailbox_enqueued", spineEvent.id, {
            sessionKey: request.sessionKey
        }), logDebugMessage("[gateway] session-targeted event", {
            id: spineEvent.id,
            type: spineEvent.type,
            session_key: request.sessionKey,
            raw_path: rawPath,
            mailboxFile
        })
    }
    return options?.bus && options.bus.emit("spine.event", spineEvent), {
        event: spineEvent,
        mailboxFile,
        routing: {
            target: routingTarget,
            enqueued
        },
        gatewayResponse,
        gatewayOutboxId
    }
}
