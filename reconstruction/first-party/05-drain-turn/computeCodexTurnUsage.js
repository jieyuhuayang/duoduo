// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: computeCodexTurnUsage  (minified: abe, daemon.pretty.js:62220)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.5.6 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.5.6 (medium): Every finalized turn now appends a one-line footer ... The footer now includes an absolute context-token count (`ctx Nk`)
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
        o = typeof i == "number" && i > 0 ? i : e.usage?.context_used_tokens;
    return {
        baseline: r,
        usage: {
            protocol: "codex",
            input_tokens: t.inputTokens - r.input,
            output_tokens: t.outputTokens - r.output,
            cache_read_input_tokens: t.cachedInputTokens - r.cached,
            context_used_tokens: o
        }
    }
}
