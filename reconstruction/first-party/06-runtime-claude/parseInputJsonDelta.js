// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: parseInputJsonDelta  (minified: dC, daemon.pretty.js:56380)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.3.2 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 4 renamed — 3 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.3.2 (medium): **runner**: Expose `tool_input_delta` in `session.execution` notifications for progressive tool input rendering.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function parseInputJsonDelta(event) {
    if (!event || typeof event != "object" || event.type !== "content_block_delta") return null;
    let index = event.index;
    if (typeof index != "number") return null;
    let delta = event.delta;
    if (!delta || typeof delta != "object" || delta.type !== "input_json_delta") return null;
    let partialJson = delta.partial_json;
    return typeof partialJson != "string" ? null : {
        index,
        partialJson
    }
}
