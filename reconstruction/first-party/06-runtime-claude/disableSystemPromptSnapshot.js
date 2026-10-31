// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: disableSystemPromptSnapshot  (minified: Uat, daemon.pretty.js:56788)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.1 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 1 renamed — 0 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.1 (medium): duoduo now explicitly opts out of the agent SDK's new system-prompt recording default.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function disableSystemPromptSnapshot(systemPrompt) {
    return typeof systemPrompt == "string" || Array.isArray(systemPrompt) ? {
        type: "custom",
        prompt: systemPrompt,
        snapshot: !1
    } : systemPrompt && typeof systemPrompt == "object" ? {
        ...systemPrompt,
        snapshot: !1
    } : systemPrompt
}
