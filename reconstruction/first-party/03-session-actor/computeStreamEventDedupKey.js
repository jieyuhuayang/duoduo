// duoduo reconstruction — subsystem: 03-session-actor
// symbol: computeStreamEventDedupKey  (minified: oRe, daemon.pretty.js:80498)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function computeStreamEventDedupKey(e) {
    return e.type === "system" ? e.subtype === "init" ? `system:${e.subtype}` : null : e.type === "thought_chunk" || e.type === "tool_input_delta" ? null : e.type === "tool_use" ? e.ephemeral ? null : `tool_use:${e.toolUseId}:${stringifyExecutionToolInput(e.input)}` : e.type === "tool_result" ? `tool_result:${e.toolUseId}:${e.isError?"1":"0"}` : null
}
