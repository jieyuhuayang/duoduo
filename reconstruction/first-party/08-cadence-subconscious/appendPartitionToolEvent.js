// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: appendPartitionToolEvent  (minified: xkt, daemon.pretty.js:88194)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 6 renamed — 2 from the code at the binding (rule), 4 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function appendPartitionToolEvent(paths, sessionKey, partitionName, toolEvent) {
    if (toolEvent.type === "tool_use") {
        let spineEvent = createSpineEvent({
            type: "agent.tool_use",
            source: {
                kind: "meta",
                name: `subconscious:${partitionName}`
            },
            session_key: sessionKey,
            payload: {
                partition: partitionName,
                tool_use_id: toolEvent.toolUseId,
                tool_name: toolEvent.toolName,
                input_summary: stringifyPartitionToolInput(toolEvent.input)
            }
        });
        await atomicAppendEvent(paths, spineEvent);
        return
    }
    if (toolEvent.type === "tool_result") {
        let spineEvent = createSpineEvent({
            type: "agent.tool_result",
            source: {
                kind: "meta",
                name: `subconscious:${partitionName}`
            },
            session_key: sessionKey,
            payload: {
                partition: partitionName,
                tool_use_id: toolEvent.toolUseId,
                tool_name: toolEvent.toolName,
                is_error: toolEvent.isError,
                summary: toolEvent.summary
            }
        });
        await atomicAppendEvent(paths, spineEvent)
    }
}
