// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: buildSystemPromptForChannelConfig  (minified: eh, daemon.pretty.js:49994)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function buildSystemPromptForChannelConfig(e, t, n, r, i) {
    let o = renderPromptLayers(e, t, n, r, i);
    if (e?.prompt_mode === "override") return o || "";
    let s = o.trim() || void 0;
    return s ? {
        type: "preset",
        preset: "claude_code",
        append: s
    } : void 0
}
