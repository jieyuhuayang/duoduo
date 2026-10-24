// duoduo reconstruction — subsystem: 03-session-actor
// symbol: computeStreamEventDedupKey  (minified: eTe, daemon.pretty.js:82626)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.3.2 (maps/history_daemon.json)
// locals: 1 renamed — 0 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function computeStreamEventDedupKey(event) {
    return event.type === "system" ? event.subtype === "init" ? `system:${event.subtype}` : null : event.type === "thought_chunk" || event.type === "tool_input_delta" ? null : event.type === "tool_use" ? event.ephemeral ? null : `tool_use:${event.toolUseId}:${stringifyExecutionToolInput(event.input)}` : event.type === "tool_result" ? `tool_result:${event.toolUseId}:${event.isError?"1":"0"}` : null
}
