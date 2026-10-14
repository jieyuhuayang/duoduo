// duoduo reconstruction — subsystem: 03-session-actor
// symbol: buildSessionExecutionPayload  (minified: lRe, daemon.pretty.js:80548)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.3.2 (maps/history_daemon.json)
// locals: 1 renamed — 0 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.3.2 (medium): **runner**: Expose `tool_input_delta` in `session.execution` notifications for progressive tool input rendering.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function buildSessionExecutionPayload(event) {
    return event.type === "thought_chunk" ? {
        type: "thought_chunk",
        text: event.text
    } : event.type === "tool_input_delta" ? {
        type: "tool_input_delta",
        tool_use_id: event.toolUseId,
        tool_name: event.toolName,
        partial_json: event.partialJson
    } : event.type === "tool_use" ? {
        type: "tool_use",
        tool_use_id: event.toolUseId,
        tool_name: event.toolName,
        input_summary: event.input !== void 0 ? stringifyExecutionToolInput(event.input) : void 0
    } : event.type === "tool_result" ? {
        type: "tool_result",
        tool_use_id: event.toolUseId,
        tool_name: event.toolName,
        is_error: event.isError,
        summary: event.summary
    } : null
}
