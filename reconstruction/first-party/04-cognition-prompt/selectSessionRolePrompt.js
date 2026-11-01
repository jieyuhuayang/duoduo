// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: selectSessionRolePrompt  (minified: sTe, daemon.pretty.js:84143)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.7 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.8.7 (high): **Every channel session gets a role.** The session aliased `main` reads a short main-role text, every other channel session a member-role text.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function selectSessionRolePrompt(e, t) {
    if (classifySessionKey(e) !== "channel") return;
    let n = t(),
        r = n.state === "held" && n.session_key === e ? "main" : "member";
    return resolveRolePromptText(r)
}
