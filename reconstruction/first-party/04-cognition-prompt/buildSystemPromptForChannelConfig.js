// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: buildSystemPromptForChannelConfig  (minified: Pm, daemon.pretty.js:49239)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function buildSystemPromptForChannelConfig(e, t, n, r) {
    let i = renderPromptLayers(e, t, n, r);
    if (e?.prompt_mode === "override") return i || "";
    let o = i.trim() || void 0;
    return o ? {
        type: "preset",
        preset: "claude_code",
        append: o
    } : void 0
}
