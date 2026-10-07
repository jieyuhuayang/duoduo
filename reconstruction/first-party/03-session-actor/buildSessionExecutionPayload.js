// duoduo reconstruction — subsystem: 03-session-actor
// symbol: buildSessionExecutionPayload  (minified: sRe, daemon.pretty.js:80502)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.3.2 (maps/history_daemon.json)
// changelog v0.3.2 (medium): **runner**: Expose `tool_input_delta` in `session.execution` notifications for progressive tool input rendering.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function buildSessionExecutionPayload(e) {
    return e.type === "thought_chunk" ? {
        type: "thought_chunk",
        text: e.text
    } : e.type === "tool_input_delta" ? {
        type: "tool_input_delta",
        tool_use_id: e.toolUseId,
        tool_name: e.toolName,
        partial_json: e.partialJson
    } : e.type === "tool_use" ? {
        type: "tool_use",
        tool_use_id: e.toolUseId,
        tool_name: e.toolName,
        input_summary: e.input !== void 0 ? stringifyExecutionToolInput(e.input) : void 0
    } : e.type === "tool_result" ? {
        type: "tool_result",
        tool_use_id: e.toolUseId,
        tool_name: e.toolName,
        is_error: e.isError,
        summary: e.summary
    } : null
}
