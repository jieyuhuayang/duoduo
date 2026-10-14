// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: replyToGatewayCommandEvent  (minified: jet, daemon.pretty.js:87780)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.6.0, v0.7.0, v0.7.1 (maps/history_daemon.json)
// locals: 10 renamed — 2 from the code at the binding (rule), 8 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function replyToGatewayCommandEvent(paths, event, bus, gatewayCommands) {
    let command = Let(event);
    if (!command) return {
        handled: !1
    };
    let sessionKey = event.session_key ?? "gateway:offline",
        commandResult = await executeGatewayCommand(paths, command, sessionKey, gatewayCommands, {
            sourceKind: event.source.kind,
            sourceChannelId: event.source.channel_id
        });
    commandResult.noticeSummary && await patchSessionRuntimeState(paths, sessionKey, {
        pending_gateway_notice: {
            source: "gateway_command",
            command: command.raw,
            command_name: command.name,
            result_summary: commandResult.noticeSummary,
            created_at: new Date().toISOString()
        }
    });
    let channelKind = sessionKey.includes(":") ? sessionKey.split(":")[0] : event.source.kind,
        outboxRecord = createOutboxRecord({
            channel_kind: channelKind,
            session_key: sessionKey,
            in_reply_to_event_id: event.id,
            payload: {
                text: commandResult.responseText,
                data: {
                    ...commandResult.data ?? {},
                    gateway_command: command.name
                }
            }
        });
    await persistOutboxRecord(paths, outboxRecord);
    let spineEvent = createSpineEvent({
        type: "agent.result",
        source: {
            kind: "gateway",
            name: "gateway"
        },
        session_key: sessionKey,
        payload: {
            outbox_id: outboxRecord.id,
            text: commandResult.responseText,
            command: command.raw,
            command_name: command.name
        }
    });
    return await atomicAppendEvent(paths, spineEvent), bus && (bus.emit("session.output", {
        sessionKey,
        record: outboxRecord
    }), bus.emit("spine.event", spineEvent)), {
        handled: !0,
        responseText: commandResult.responseText,
        outboxId: outboxRecord.id
    }
}
