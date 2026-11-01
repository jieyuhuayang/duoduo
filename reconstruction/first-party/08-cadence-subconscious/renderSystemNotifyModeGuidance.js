// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: renderSystemNotifyModeGuidance  (minified: aft, daemon.pretty.js:66537)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.3.0 — first release whose bundle holds this declaration; body changed in v0.4.0, v0.8.2, v0.8.7 (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderSystemNotifyModeGuidance() {
    return [OO(), "", "System session mode:", "- You MUST provide `target_session_key`; `main` reaches the main session.", "- Call ViewSessions with no argument to see the sessions you can target (prefer active foreground sessions).", "", "IMPORTANT: To reach the end user, you must target a foreground channel session", "(e.g., lark:oc_xxx:ou_yyy, stdio:default). Notifying another background session", "will NOT produce user-visible output."].join(`
`)
}
