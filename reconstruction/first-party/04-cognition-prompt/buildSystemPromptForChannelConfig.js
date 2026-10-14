// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: buildSystemPromptForChannelConfig  (minified: hg, daemon.pretty.js:55436)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.4.5, v0.5.1, v0.5.2, v0.5.4, v0.5.5, v0.7.1, v0.8.0 (maps/history_daemon.json)
// locals: 7 renamed — 1 from the code at the binding (rule), 6 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function buildSystemPromptForChannelConfig(channelConfig, sessionKey, job, board, runtime) {
    let promptLayers = renderPromptLayers(channelConfig, sessionKey, job, board, runtime);
    if (channelConfig?.prompt_mode === "override") return promptLayers || "";
    let append = promptLayers.trim() || void 0;
    return append ? {
        type: "preset",
        preset: "claude_code",
        append
    } : void 0
}
