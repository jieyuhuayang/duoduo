// duoduo reconstruction — subsystem: 03-session-actor
// symbol: resolvePiAgentDir  (minified: CS, daemon.pretty.js:73448)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.8.0 (medium): `/model` lists the models *this* installation can actually run — resolved from the providers and extensions your pi has, not from a list we hardcoded
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolvePiAgentDir() {
    return process.env.PI_CODING_AGENT_DIR ?? uEe.join(Aht(), ".pi", "agent")
}
