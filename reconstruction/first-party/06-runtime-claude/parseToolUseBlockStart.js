// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: parseToolUseBlockStart  (minified: G$, daemon.pretty.js:55115)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.3.2 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 5 renamed — 4 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.3.2 (medium): **runner**: Expose `tool_input_delta` in `session.execution` notifications for progressive tool input rendering.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function parseToolUseBlockStart(event) {
    if (!event || typeof event != "object" || event.type !== "content_block_start") return null;
    let index = event.index;
    if (typeof index != "number") return null;
    let contentBlock = event.content_block;
    if (!contentBlock || typeof contentBlock != "object" || contentBlock.type !== "tool_use") return null;
    let id = contentBlock.id,
        name = contentBlock.name;
    return typeof id != "string" || typeof name != "string" ? null : {
        index,
        toolUseId: id,
        toolName: name
    }
}
