// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: renderChannelNotifyModeGuidance  (minified: _we, daemon.pretty.js:66532)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.3.0 — first release whose bundle holds this declaration; body changed in v0.8.2, v0.8.7 (maps/history_daemon.json)
// changelog v0.8.7 (high): **Main session.** One channel session holds the alias `main`; Notify takes `main` as an explicit target and resolves it at each delivery.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderChannelNotifyModeGuidance() {
    return [OO(), "", "Channel (foreground) session mode:", "- You MUST provide `target_session_key`; `main` reaches the main session.", "- Call ViewSessions with no argument to see the sessions you can target.", "- Use this to relay information, hand off completed work, or coordinate across sessions.", "- Example: you completed a task in CLI and want to notify the user via a Feishu channel session."].join(`
`)
}
