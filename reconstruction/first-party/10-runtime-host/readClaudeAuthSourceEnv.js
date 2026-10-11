// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: readClaudeAuthSourceEnv  (minified: QH, daemon.pretty.js:89438)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.4.3 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 2 renamed — 0 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.4.3 (medium): refactor: simplify host onboarding auth flow
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function readClaudeAuthSourceEnv(env = process.env) {
    let authSource = env.ALADUO_CLAUDE_AUTH_SOURCE ?? env.ALADUO_AUTH_SOURCE;
    return authSource && isClaudeAuthSource(authSource) ? authSource : void 0
}
