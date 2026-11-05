// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: buildSystemPromptForChannelConfig  (minified: Ig, daemon.pretty.js:56706)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.7.1 — first release whose bundle holds this declaration; body changed in v0.8.0, v0.8.7 (maps/history_daemon.json)
// locals: 8 renamed — 1 from the code at the binding (rule), 7 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.7 (medium): **Every channel session gets a role.** The session aliased `main` reads a short main-role text, every other channel session a member-role text.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function buildSystemPromptForChannelConfig(channelConfig, sessionKey, jobMission, board, runtime, rolePrompt) {
    let promptLayers = renderPromptLayers(channelConfig, sessionKey, jobMission, board, runtime, rolePrompt);
    if (channelConfig?.prompt_mode === "override") return promptLayers || "";
    let appendText = promptLayers.trim() || void 0;
    return appendText ? {
        type: "preset",
        preset: "claude_code",
        append: appendText
    } : void 0
}
