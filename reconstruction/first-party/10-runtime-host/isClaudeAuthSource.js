// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: isClaudeAuthSource  (minified: Jft, daemon.pretty.js:89434)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.4.3 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.4.3 (medium): refactor: simplify host onboarding auth flow
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isClaudeAuthSource(e) {
    return e === "claude_code_local" || e === "anthropic_api_key" || e === "compatible_endpoint"
}
