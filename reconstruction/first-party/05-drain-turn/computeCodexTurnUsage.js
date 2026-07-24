// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: computeCodexTurnUsage  (minified: Ole, daemon.pretty.js:57330)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function computeCodexTurnUsage(e, t, n) {
    if (!t) return e;
    let r = e.baseline;
    if (!r && n && n.inputTokens > 0 && (r = {
            input: t.inputTokens - n.inputTokens,
            output: t.outputTokens - n.outputTokens,
            cached: t.cachedInputTokens - n.cachedInputTokens
        }), !r) return {
        ...e
    };
    let i = n && n.inputTokens > 0 ? n.totalTokens : void 0,
        s = typeof i == "number" && i > 0 ? i : e.usage?.context_used_tokens;
    return {
        baseline: r,
        usage: {
            protocol: "codex",
            input_tokens: t.inputTokens - r.input,
            output_tokens: t.outputTokens - r.output,
            cache_read_input_tokens: t.cachedInputTokens - r.cached,
            context_used_tokens: s
        }
    }
}
