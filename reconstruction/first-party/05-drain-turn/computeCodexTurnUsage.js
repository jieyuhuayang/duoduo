// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: computeCodexTurnUsage  (minified: nwe, daemon.pretty.js:64303)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.5.6 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 6 renamed — 1 from the code at the binding (rule), 5 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.6 (medium): Every finalized turn now appends a one-line footer ... The footer now includes an absolute context-token count (`ctx Nk`)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function computeCodexTurnUsage(state, cumulativeUsage, lastTurnUsage) {
    if (!cumulativeUsage) return state;
    let baseline = state.baseline;
    if (!baseline && lastTurnUsage && lastTurnUsage.inputTokens > 0 && (baseline = {
            input: cumulativeUsage.inputTokens - lastTurnUsage.inputTokens,
            output: cumulativeUsage.outputTokens - lastTurnUsage.outputTokens,
            cached: cumulativeUsage.cachedInputTokens - lastTurnUsage.cachedInputTokens
        }), !baseline) return {
        ...state
    };
    let lastTurnTotalTokens = lastTurnUsage && lastTurnUsage.inputTokens > 0 ? lastTurnUsage.totalTokens : void 0,
        contextUsedTokens = typeof lastTurnTotalTokens == "number" && lastTurnTotalTokens > 0 ? lastTurnTotalTokens : state.usage?.context_used_tokens;
    return {
        baseline,
        usage: {
            protocol: "codex",
            input_tokens: cumulativeUsage.inputTokens - baseline.input,
            output_tokens: cumulativeUsage.outputTokens - baseline.output,
            cache_read_input_tokens: cumulativeUsage.cachedInputTokens - baseline.cached,
            context_used_tokens: contextUsedTokens
        }
    }
}
