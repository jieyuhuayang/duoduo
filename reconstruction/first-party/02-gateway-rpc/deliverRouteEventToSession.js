// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: deliverRouteEventToSession  (minified: Ns, daemon.pretty.js:67121)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in v0.8.1, v0.8.4 (maps/history_daemon.json)
// locals: 21 renamed — 14 from the code at the binding (rule), 7 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function deliverRouteEventToSession(paths, bus, delivery) {
    let {
        traceId,
        routeId,
        sourceName,
        sourceKind,
        channelDescriptorId,
        targetSessionKey,
        sourceSessionKey,
        eventType,
        payload,
        preempt,
        walOnly,
        enqueueWithoutWake
    } = delivery;
    if (isSessionArchiving(targetSessionKey)) return logWarnMessage("[route] delivery refused: session is being archived", {
        traceId,
        routeId,
        sourceSessionKey,
        sourceEventType: eventType,
        targetSessionKey
    }), {
        routeId,
        targetSessionKey,
        success: !1,
        error: "session_archiving"
    };
    if (isSessionArchived(paths, targetSessionKey)) return logWarnMessage("[route] delivery refused: session archived", {
        traceId,
        routeId,
        sourceSessionKey,
        sourceEventType: eventType,
        targetSessionKey
    }), {
        routeId,
        targetSessionKey,
        success: !1,
        error: "session_archived"
    };
    try {
        let spineEvent = createSpineEvent({
            type: "route.deliver",
            source: {
                kind: sourceKind ?? "route",
                name: sourceName ?? routeId
            },
            session_key: targetSessionKey,
            payload: {
                route_id: routeId,
                source_session_key: sourceSessionKey,
                source_event_type: eventType,
                channel_descriptor_id: channelDescriptorId,
                payload
            }
        });
        if (await atomicAppendEvent(paths, spineEvent), logDebugMessage("[route] route event appended", {
                traceId,
                routeId,
                sourceSessionKey,
                targetSessionKey,
                sourceEventType: eventType,
                eventId: spineEvent.id
            }), walOnly) return logDebugMessage("[route] wal-only route event (no mailbox, no wake)", {
            traceId,
            routeId,
            sourceSessionKey,
            targetSessionKey,
            sourceEventType: eventType,
            eventId: spineEvent.id
        }), {
            routeId,
            targetSessionKey,
            success: !0,
            eventId: spineEvent.id,
            eventTs: spineEvent.ts
        };
        if (await isVoidRuntimeSession(paths, targetSessionKey)) {
            let payloadRecord = Lpt(payload) ? payload : {},
                outboxRecord = await writeVoidSessionOutboxRecord(paths, bus, {
                    sessionKey: targetSessionKey,
                    text: typeof payloadRecord.text == "string" ? payloadRecord.text : "",
                    data: {
                        ...payloadRecord,
                        event_id: spineEvent.id,
                        event_ts: spineEvent.ts,
                        source_session_key: sourceSessionKey
                    }
                });
            return logDebugMessage("[route] delivered to void session outbox (no mailbox, no wake)", {
                traceId,
                routeId,
                sourceSessionKey,
                targetSessionKey,
                eventId: spineEvent.id,
                outboxId: outboxRecord.id
            }), {
                routeId,
                targetSessionKey,
                success: !0,
                eventId: spineEvent.id,
                eventTs: spineEvent.ts
            }
        }
        let mailboxPath = await enqueueSessionInboxLine(paths, targetSessionKey, `- [ ] @evt(${spineEvent.id})`);
        if (logDebugMessage("[route] mailbox enqueued", {
                traceId,
                routeId,
                targetSessionKey,
                eventId: spineEvent.id,
                mailboxPath
            }), enqueueWithoutWake) return logDebugMessage("[route] enqueued without wake (waits for the owner's next turn)", {
            traceId,
            routeId,
            sourceSessionKey,
            sourceEventType: eventType,
            targetSessionKey,
            eventId: spineEvent.id,
            mailboxPath
        }), {
            routeId,
            targetSessionKey,
            success: !0,
            eventId: spineEvent.id,
            eventTs: spineEvent.ts,
            mailboxPath
        };
        let preemptMode = preempt ?? (eventType === "notify" || eventType === "job.complete" || eventType === "job.fail" ? "never" : "allow");
        return bus.emit("session.wake", {
            sessionKey: targetSessionKey,
            preempt: preemptMode
        }), logDebugMessage("[route] delivered to target inbox", {
            traceId,
            routeId,
            sourceSessionKey,
            sourceEventType: eventType,
            targetSessionKey,
            eventId: spineEvent.id,
            mailboxPath
        }), {
            routeId,
            targetSessionKey,
            success: !0,
            eventId: spineEvent.id,
            eventTs: spineEvent.ts,
            mailboxPath
        }
    } catch (err) {
        throw logWarnMessage("[route] failed to enqueue to target inbox", {
            traceId,
            routeId,
            sourceSessionKey,
            sourceEventType: eventType,
            targetSessionKey,
            error: String(err)
        }), err
    }
}
