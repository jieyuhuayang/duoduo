// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: createDrainExecutionEventRecorder  (minified: h0e, daemon.pretty.js:73508)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.3.2, v0.3.3, v0.8.0 (maps/history_daemon.json)
// locals: 9 renamed — 2 from the code at the binding (rule), 7 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createDrainExecutionEventRecorder(paths, sessionKey, eventSessionKey, onExecutionEvent, anchorEventId) {
    return async event => {
        if (wyt(event) && logDebugMessage("[runner] execution event", {
                sessionKey,
                eventType: event.type,
                ...event.type === "tool_use" ? {
                    toolName: event.toolName,
                    toolUseId: event.toolUseId
                } : event.type === "tool_result" ? {
                    toolName: event.toolName,
                    toolUseId: event.toolUseId,
                    isError: event.isError
                } : event.type === "tool_input_delta" ? {
                    toolName: event.toolName,
                    toolUseId: event.toolUseId
                } : event.type === "thought_chunk" ? {
                    text: event.text
                } : {
                    subtype: event.subtype
                }
            }), onExecutionEvent && onExecutionEvent(event, anchorEventId), event.type === "tool_use" && !event.ephemeral) {
            let inputSummary = event.input === void 0 || event.input === null ? "{}" : typeof event.input == "string" ? event.input : JSON.stringify(event.input) ?? "{}",
                spineEvent = createSpineEvent({
                    type: "agent.tool_use",
                    source: {
                        kind: "runner",
                        name: "runner"
                    },
                    session_key: eventSessionKey,
                    payload: {
                        tool_use_id: event.toolUseId,
                        tool_name: event.toolName,
                        input_summary: inputSummary
                    }
                });
            await atomicAppendEvent(paths, spineEvent)
        } else if (event.type === "tool_result") {
            let spineEvent = createSpineEvent({
                type: "agent.tool_result",
                source: {
                    kind: "runner",
                    name: "runner"
                },
                session_key: eventSessionKey,
                payload: {
                    tool_use_id: event.toolUseId,
                    tool_name: event.toolName,
                    is_error: event.isError,
                    summary: event.summary
                }
            });
            await atomicAppendEvent(paths, spineEvent)
        }
    }
}
