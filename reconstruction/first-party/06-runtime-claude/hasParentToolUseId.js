// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: hasParentToolUseId  (minified: Vf, daemon.pretty.js:56271)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.7 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 2 renamed — 1 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.7 (medium): Internal subagent streaming output is now marked as a side channel and dropped by channels rather than rendered into the main reply.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function hasParentToolUseId(message) {
    if (!message || typeof message != "object") return !1;
    let parentToolUseId = message.parent_tool_use_id;
    return typeof parentToolUseId == "string" && parentToolUseId.length > 0
}
