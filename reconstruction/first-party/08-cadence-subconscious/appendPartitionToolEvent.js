// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: appendPartitionToolEvent  (minified: Ugt, daemon.pretty.js:85715)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function appendPartitionToolEvent(e, t, n, r) {
    if (r.type === "tool_use") {
        let i = createSpineEvent({
            type: "agent.tool_use",
            source: {
                kind: "meta",
                name: `subconscious:${n}`
            },
            session_key: t,
            payload: {
                partition: n,
                tool_use_id: r.toolUseId,
                tool_name: r.toolName,
                input_summary: stringifyPartitionToolInput(r.input)
            }
        });
        await atomicAppendEvent(e, i);
        return
    }
    if (r.type === "tool_result") {
        let i = createSpineEvent({
            type: "agent.tool_result",
            source: {
                kind: "meta",
                name: `subconscious:${n}`
            },
            session_key: t,
            payload: {
                partition: n,
                tool_use_id: r.toolUseId,
                tool_name: r.toolName,
                is_error: r.isError,
                summary: r.summary
            }
        });
        await atomicAppendEvent(e, i)
    }
}
