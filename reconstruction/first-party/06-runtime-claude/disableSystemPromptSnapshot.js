// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: disableSystemPromptSnapshot  (minified: kot, daemon.pretty.js:55518)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.1 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.8.1 (medium): duoduo now explicitly opts out of the agent SDK's new system-prompt recording default.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function disableSystemPromptSnapshot(e) {
    return typeof e == "string" || Array.isArray(e) ? {
        type: "custom",
        prompt: e,
        snapshot: !1
    } : e && typeof e == "object" ? {
        ...e,
        snapshot: !1
    } : e
}
