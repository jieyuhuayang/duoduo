// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: isClaudeAuthSource  (minified: pht, daemon.pretty.js:90919)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.4.3 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 1 renamed — 0 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.4.3 (medium): refactor: simplify host onboarding auth flow
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isClaudeAuthSource(value) {
    return value === "claude_code_local" || value === "anthropic_api_key" || value === "compatible_endpoint"
}
