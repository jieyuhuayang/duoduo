// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: createDrainExecutionEventRecorder  (minified: ake, daemon.pretty.js:71983)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createDrainExecutionEventRecorder(e, t, n, r, i) {
    return async o => {
        if (_ft(o) && Re("[runner] execution event", {
                sessionKey: t,
                eventType: o.type,
                ...o.type === "tool_use" ? {
                    toolName: o.toolName,
                    toolUseId: o.toolUseId
                } : o.type === "tool_result" ? {
                    toolName: o.toolName,
                    toolUseId: o.toolUseId,
                    isError: o.isError
                } : o.type === "tool_input_delta" ? {
                    toolName: o.toolName,
                    toolUseId: o.toolUseId
                } : o.type === "thought_chunk" ? {
                    text: o.text
                } : {
                    subtype: o.subtype
                }
            }), r && r(o, i), o.type === "tool_use" && !o.ephemeral) {
            let s = o.input === void 0 || o.input === null ? "{}" : typeof o.input == "string" ? o.input : JSON.stringify(o.input) ?? "{}",
                a = createSpineEvent({
                    type: "agent.tool_use",
                    source: {
                        kind: "runner",
                        name: "runner"
                    },
                    session_key: n,
                    payload: {
                        tool_use_id: o.toolUseId,
                        tool_name: o.toolName,
                        input_summary: s
                    }
                });
            await atomicAppendEvent(e, a)
        } else if (o.type === "tool_result") {
            let s = createSpineEvent({
                type: "agent.tool_result",
                source: {
                    kind: "runner",
                    name: "runner"
                },
                session_key: n,
                payload: {
                    tool_use_id: o.toolUseId,
                    tool_name: o.toolName,
                    is_error: o.isError,
                    summary: o.summary
                }
            });
            await atomicAppendEvent(e, s)
        }
    }
}
